const path = require('path');
const { createLog } = require('../../utils/logger');
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);
const uuid = require('uuid');
const moment = require('moment');
const { ORDER_PROCESSES } = require('../../models/Transaction');
const Exchanges = {
  bitflyer: require('../exchanges/Bitflyer'),
  zaif: require('../exchanges/Zaif')
};
const { ERROR_CODES } = require('../exchanges/errors');
const { result, transaction } = require('./transactions');

const logger = createLog('scheduler', path.basename(__filename));

const lockedTransactionsReleaseTimeSec = process.env.SCHEDULER_LOCKED_TRANSACTIONS_RELEASE_TIME_SECONDS;
const commitmentTimeLimitSec = process.env.SCHEDULER_COMMITMENT_TIME_LIMIT_SECONDS;
const orderRetryIntervalMSec = process.env.SCHEDULER_ORDER_RETRY_INTERVAL_SECONDS * 1000;
const orderRetryTimes = process.env.SCHEDULER_ORDER_RETRY_TIMES;

const parseError = (error) => {
  let errorCode, errorDetail;
  if (!error.code) {
    // FATAL: database error or bugs
    errorCode = ERROR_CODES.UNKNOWN_ERROR;
    errorDetail = error.toString();
  } else if (error.code === ERROR_CODES.NETWORK_ERROR) {
    errorCode = ERROR_CODES.NETWORK_ERROR;
    errorDetail = `[${error.provider}] [${error.statusCode}] ${error.message}`;
  } else if (error.code === ERROR_CODES.API_UNAUTHORIZED) {
    errorCode = ERROR_CODES.API_UNAUTHORIZED;
    errorDetail = `[${error.provider}] [${error.statusCode}] ${error.message}`;
  } else if (error.code === ERROR_CODES.API_TEMPORARILY_UNAVAILABLE) {
    errorCode = ERROR_CODES.API_TEMPORARILY_UNAVAILABLE;
    errorDetail = `[${error.provider}] [${error.statusCode}] ${error.message}`;
  } else {
    errorCode = ERROR_CODES.API_FAILURE;
    errorDetail = `[${error.provider}] [${error.statusCode}] ${error.message}`;
  }
  return { errorCode, errorDetail };
};

async function retryPromise(promise, args, retryIntervalMSec, retryTimes, instance = null) {
  try {
    const result = await promise.apply(instance, args);
    return result;
  } catch (error) {
    if (error.code && error.code === ERROR_CODES.API_TEMPORARILY_UNAVAILABLE && retryTimes > 0) {
      logger.warn(`Retrying... after waiting ${retryIntervalMSec} [msec].`);
      logger.debug(`Retry interval is ${retryIntervalMSec} [msec] and Retry times is ${retryTimes}.`);
      await setTimeoutPromise(retryIntervalMSec);
      return retryPromise(promise, args, retryIntervalMSec, retryTimes - 1, instance);
    } else {
      return Promise.reject(error);
    }
  }
}

class SimpleArbitrageStrategy {
  constructor(argsObj) {
    this.userId = argsObj.userId;
    this.ruleId = argsObj.ruleId;
    this.arbitrageStrategy = argsObj.arbitrageStrategy;
    this.coinUnit = argsObj.coinUnit;
    this.currencyUnit = argsObj.currencyUnit;
    this.orderType = argsObj.orderType;
    this.assetRange = argsObj.assetRange;
    this.assetMinLimit = argsObj.assetMinLimit;
    this.buyWeightRate = argsObj.buyWeightRate;
    this.sellWeightRate = argsObj.sellWeightRate;
    this.ExchangeA = new Exchanges[argsObj.a.siteName](
      argsObj.a.siteName,
      argsObj.a.apiKey,
      argsObj.a.apiSecret,
      argsObj.coinUnit,
      argsObj.currencyUnit
    );
    this.ExchangeB = new Exchanges[argsObj.b.siteName](
      argsObj.b.siteName,
      argsObj.b.apiKey,
      argsObj.b.apiSecret,
      argsObj.coinUnit,
      argsObj.currencyUnit
    );
  }

  async doArbitrage() {
    const buyTransactionId = uuid.v4();
    const sellTransactionId = uuid.v4();

    try {
      logger.debug('Arguments =>');
      logger.debug('userId', this.userId);
      logger.debug('ruleId', this.ruleId);
      logger.debug('arbitrageStrategy', this.arbitrageStrategy);
      logger.debug('coinUnit', this.coinUnit);
      logger.debug('currencyUnit', this.currencyUnit);
      logger.debug('orderType', this.orderType);
      logger.debug('assetRange', this.assetRange);
      logger.debug('assetMinLimit', this.assetMinLimit);
      logger.debug('commitmentTimeLimit', this.commitmentTimeLimit);
      logger.debug('buyWeightRate', this.buyWeightRate);
      logger.debug('sellWeightRate', this.sellWeightRate);

      // Check working transactions
      const workingTransactions = await transaction.getWorking(this.ruleId);
      if (workingTransactions.length > 0) {
        // Release locked transactions
        const releasedTransactions = await Promise.all(
          workingTransactions.map(async (lockedTransaction) => {
            const mNow = moment();
            const mModifiedAt = moment(lockedTransaction.modifiedAt);
            const diffSec = mModifiedAt.diff(mNow, 'seconds');

            if (diffSec > lockedTransactionsReleaseTimeSec) {
              // => FAILED
              const releasedTransaction = await transaction.failed(
                lockedTransaction.userId,
                lockedTransaction.transactionId,
                ERROR_CODES.RELEASED_LOCKED_TRANSACTIONS
              );
              return releasedTransaction;
            }
          })
        );

        logger.debug('Released transactions =>');
        logger.debug(releasedTransactions);
        logger.warn(`Released ${releasedTransactions.count} transactions and Skipping to make new transactions...`);

        return result.noTransaction();
      }

      // Transaction minimum price unit
      const transactionMinPriceUnitA = await this.ExchangeA.getTransactionMinPriceUnit();
      const transactionMinPriceUnitB = await this.ExchangeB.getTransactionMinPriceUnit();

      logger.debug('Transaction minimum price units =>');
      logger.debug(`[${this.ExchangeA.getName()}] ${transactionMinPriceUnitA}`);
      logger.debug(`[${this.ExchangeB.getName()}] ${transactionMinPriceUnitA}`);

      // Compute best bid and best ask, then Weighting and Align the price unit
      const boardA = await this.ExchangeA.getSortedBoard();
      const bestBidPriceA =
        Math.floor(boardA.bids[0].price * this.sellWeightRate) % transactionMinPriceUnitA === 0
          ? Math.floor(boardA.bids[0].price * this.sellWeightRate)
          : Math.floor(boardA.bids[0].price * this.sellWeightRate) -
            Math.floor(boardA.bids[0].price * this.sellWeightRate) % transactionMinPriceUnitA;
      const bestAskPriceA =
        Math.floor(boardA.asks[0].price * this.buyWeightRate) % transactionMinPriceUnitA === 0
          ? Math.floor(boardA.asks[0].price * this.buyWeightRate)
          : Math.floor(boardA.asks[0].price * this.buyWeightRate) -
            Math.floor(boardA.asks[0].price * this.buyWeightRate) % transactionMinPriceUnitA;
      const bestAskAmountA = boardA.asks[0].amount;

      const boardB = await this.ExchangeB.getSortedBoard();
      const bestBidPriceB =
        Math.floor(boardB.bids[0].price * this.sellWeightRate) % transactionMinPriceUnitB === 0
          ? Math.floor(boardB.bids[0].price * this.sellWeightRate)
          : Math.floor(boardB.bids[0].price * this.sellWeightRate) -
            Math.floor(boardB.bids[0].price * this.sellWeightRate) % transactionMinPriceUnitB;
      const bestAskPriceB =
        Math.floor(boardB.asks[0].price * this.buyWeightRate) % transactionMinPriceUnitB === 0
          ? Math.floor(boardB.asks[0].price * this.buyWeightRate)
          : Math.floor(boardB.asks[0].price * this.buyWeightRate) -
            Math.floor(boardB.asks[0].price * this.buyWeightRate) % transactionMinPriceUnitB;
      const bestAskAmountB = boardB.asks[0].amount;

      logger.info('Best bids and asks =>');
      logger.info(`[${this.ExchangeA.getName()}][BID][Price] ${bestBidPriceA}`);
      logger.info(`[${this.ExchangeA.getName()}][ASK][Price] ${bestAskPriceA}`);
      logger.info(`[${this.ExchangeA.getName()}][ASK][Amount] ${bestAskAmountA}`);
      logger.info(`[${this.ExchangeB.getName()}][BID][Price] ${bestBidPriceB}`);
      logger.info(`[${this.ExchangeB.getName()}][ASK][Price] ${bestAskPriceB}`);
      logger.info(`[${this.ExchangeB.getName()}][ASK][Amount] ${bestAskAmountB}`);

      // Compute transaction fees
      const transactionFeeRateA = await this.ExchangeA.getTransactionFeeRate();
      const transactionFeeRateB = await this.ExchangeB.getTransactionFeeRate();
      const bestBidFeeA = bestBidPriceA * transactionFeeRateA;
      const bestAskFeeA = bestAskPriceA * transactionFeeRateA;
      const bestBidFeeB = bestBidPriceB * transactionFeeRateB;
      const bestAskFeeB = bestAskPriceB * transactionFeeRateB;

      logger.info('Fee rates =>');
      logger.info(`[${this.ExchangeA.getName()}][Rate] ${transactionFeeRateA}`);
      logger.info(`[${this.ExchangeB.getName()}][Rate] ${transactionFeeRateB}`);

      logger.debug('Fees =>');
      logger.debug(`[${this.ExchangeA.getName()}][BID][Fee] ${bestBidFeeA}`);
      logger.debug(`[${this.ExchangeA.getName()}][ASK][Fee] ${bestAskFeeA}`);
      logger.debug(`[${this.ExchangeB.getName()}][BID][Fee] ${bestBidFeeB}`);
      logger.debug(`[${this.ExchangeB.getName()}][ASK][Fee] ${bestAskFeeB}`);

      // Compute transaction minimum amount and digit
      const transactionMinAmountA = this.ExchangeA.getTransactionMinAmount();
      const transactionMinAmountB = this.ExchangeB.getTransactionMinAmount();
      const transactionMinAmount =
        transactionMinAmountA > transactionMinAmountB ? transactionMinAmountA : transactionMinAmountB;
      const transactionDigit = String(transactionMinAmount).split('.')[1].length;

      // Compute trade limits
      const assetsAmountsA = await this.ExchangeA.getAssets();
      const assetsAmountsB = await this.ExchangeB.getAssets();
      const possiblePriceLimitA = (assetsAmountsA.presentCurrencyAmount - this.assetMinLimit) * this.assetRange;
      const possibleCoinAmountLimitA = assetsAmountsA.presentCoinAmount;
      const possiblePriceLimitB = (assetsAmountsB.presentCurrencyAmount - this.assetMinLimit) * this.assetRange;
      const possibleCoinAmountLimitB = assetsAmountsB.presentCoinAmount;

      if (possiblePriceLimitA < 0 || possiblePriceLimitB < 0) {
        logger.warn(`Asset minimum limit exceeded asset ptice and Skipping to make new transactions...`);
        return result.noTransaction();
      }

      logger.debug('[Limits to trade]');
      logger.debug(`[${this.ExchangeA.getName()}][Coin] ${possibleCoinAmountLimitA}`);
      logger.debug(`[${this.ExchangeA.getName()}][Currency] ${possiblePriceLimitA}`);
      logger.debug(`[${this.ExchangeB.getName()}][Coin] ${possibleCoinAmountLimitB}`);
      logger.debug(`[${this.ExchangeB.getName()}][Currency] ${possiblePriceLimitB}`);

      // Condition
      // A_Bid*(1 - A_FeeRate) - B_Ask*(1 - B_FeeRate) > (A_Bid*A_FeeRate) + (B_Ask*B_FeeRate)
      // => A_Bid - (A_Bid*A_FeeRate) - B_Ask + (B_Ask*B_FeeRate) > (A_Bid*A_FeeRate) + (B_Ask*B_FeeRate)
      // => A_Bid - A_BidFee - B_Ask + B_AskFee > A_BidFee + B_AskFee
      // => A_Bid - B_Ask - 2*A_BidFee > 0
      const isConditionedToBuyAskBAndSellBidA = bestBidPriceA - bestAskPriceB - 2 * bestBidFeeA > 0 ? true : false;
      const isConditionedToBuyAskAAndSellBidB = bestBidPriceB - bestAskPriceA - 2 * bestBidFeeB > 0 ? true : false;

      logger.info('Conditions =>');
      logger.info(
        `BUY ${this.ExchangeB.getName()}'s ask and SEL ${this.ExchangeA.getName()}'s bid ? => ${isConditionedToBuyAskBAndSellBidA}`
      );
      logger.info(
        `BUY ${this.ExchangeA.getName()}'s ask and SEL  ${this.ExchangeB.getName()}'s bid ? => ${isConditionedToBuyAskAAndSellBidB}`
      );

      // Compute target to buy and sell
      let target;
      if (isConditionedToBuyAskBAndSellBidA) {
        const buyPrice = bestAskPriceA;
        const sellPrice = bestBidPriceB;

        let buyAmount = 0;
        if (buyPrice * bestAskAmountB > possiblePriceLimitB) {
          buyAmount = possiblePriceLimitB / buyPrice;
        } else {
          buyAmount = bestAskAmountB;
        }

        let sellAmount = buyAmount;
        if (sellAmount > possibleCoinAmountLimitA) {
          buyAmount = sellAmount = possibleCoinAmountLimitA;
        }

        const fixedBuyAmount = Math.floor(buyAmount * Math.pow(10, transactionDigit)) / Math.pow(10, transactionDigit);
        const fixedSellAmount =
          Math.floor(sellAmount * Math.pow(10, transactionDigit)) / Math.pow(10, transactionDigit);

        logger.debug('Buy and Sell amounts =>');
        logger.debug(`[BUY][Amount][Raw] ${buyAmount}`);
        logger.debug(`[BUY][Amount][Fixed] ${fixedBuyAmount}`);
        logger.debug(`[SELL][Amount][Raw] ${sellAmount}`);
        logger.debug(`[SELL][Amount][Fixed] ${fixedSellAmount}`);

        target = {
          buy: {
            api: this.ExchangeB,
            orderPrice: buyPrice,
            orderAmount: fixedBuyAmount,
            transactionFeeRate: transactionFeeRateB,
            laterAssetCoin: assetsAmountsB.presentCoinAmount + fixedBuyAmount * (1 - transactionFeeRateB),
            laterAssetPrice: assetsAmountsB.presentCurrencyAmount - buyPrice * fixedBuyAmount
          },
          sell: {
            api: this.ExchangeA,
            orderPrice: sellPrice,
            orderAmount: fixedSellAmount,
            transactionFeeRate: transactionFeeRateA,
            laterAssetCoin: assetsAmountsA.presentCoinAmount - fixedSellAmount * (1 + transactionFeeRateA),
            laterAssetPrice: assetsAmountsA.presentCurrencyAmount + sellPrice * fixedSellAmount
          }
        };
      } else if (isConditionedToBuyAskAAndSellBidB) {
        const buyPrice = bestAskPriceA;
        const sellPrice = bestBidPriceB;

        let buyAmount = 0;
        if (buyPrice * bestAskAmountA > possiblePriceLimitA) {
          buyAmount = possiblePriceLimitA / buyPrice;
        } else {
          buyAmount = bestAskAmountA;
        }

        let sellAmount = buyAmount;
        if (sellAmount > possibleCoinAmountLimitB) {
          buyAmount = sellAmount = possibleCoinAmountLimitB;
        }

        const fixedBuyAmount = Math.floor(buyAmount * Math.pow(10, transactionDigit)) / Math.pow(10, transactionDigit);
        const fixedSellAmount =
          Math.floor(sellAmount * Math.pow(10, transactionDigit)) / Math.pow(10, transactionDigit);

        logger.debug('Buy and Sell amounts =>');
        logger.debug(`[BUY][Amount][Raw] ${buyAmount}`);
        logger.debug(`[BUY][Amount][Fixed] ${fixedBuyAmount}`);
        logger.debug(`[SELL][Amount][Raw] ${sellAmount}`);
        logger.debug(`[SELL][Amount][Fixed] ${fixedSellAmount}`);

        target = {
          buy: {
            api: this.ExchangeA,
            orderPrice: buyPrice,
            orderAmount: Math.floor(buyAmount * Math.pow(10, transactionDigit)) / Math.pow(10, transactionDigit),
            transactionFeeRate: transactionFeeRateA,
            laterAssetCoin: assetsAmountsA.presentCoinAmount + fixedBuyAmount * (1 - transactionFeeRateA),
            laterAssetPrice: assetsAmountsA.presentCurrencyAmount - buyPrice * fixedBuyAmount
          },
          sell: {
            api: this.ExchangeB,
            orderPrice: sellPrice,
            orderAmount: Math.floor(sellAmount * Math.pow(10, transactionDigit)) / Math.pow(10, transactionDigit),
            transactionFeeRate: transactionFeeRateB,
            laterAssetCoin: assetsAmountsB.presentCoinAmount - fixedSellAmount * (1 + transactionFeeRateB),
            laterAssetPrice: assetsAmountsB.presentCurrencyAmount + sellPrice * fixedSellAmount
          }
        };
      } else {
        logger.warn(`NO match condition and Skipping to make new transactions...`);
        return result.noTransaction();
      }

      if (target.buy.orderAmount < transactionMinAmount) {
        logger.warn(`Too small order amount and Skipping to make new transactions...`);
        return result.noTransaction();
      }

      const anticipatedProfit = Math.floor(
        target.sell.orderPrice * target.sell.orderAmount * (1 - target.sell.transactionFeeRate) -
          target.buy.orderPrice * target.buy.orderAmount * (1 - target.buy.transactionFeeRate)
      );

      logger.info('Order targets =>');
      logger.info(`[${target.buy.api.getName()}][BUY][Price] ${target.buy.orderPrice}`);
      logger.info(`[${target.buy.api.getName()}][BUY][Amount] ${target.buy.orderAmount}`);
      logger.info(`[${target.buy.api.getName()}][BUY][Fee Rate] ${target.buy.transactionFeeRate}`);
      logger.info(`[${target.buy.api.getName()}][BUY][Later Asset Coin] ${target.buy.laterAssetCoin}`);
      logger.info(`[${target.buy.api.getName()}][BUY][Later Asset Price] ${target.buy.laterAssetPrice}`);
      logger.info(`[${target.sell.api.getName()}][SELL][Price] ${target.sell.orderPrice}`);
      logger.info(`[${target.sell.api.getName()}][SELL][Amount] ${target.sell.orderAmount}`);
      logger.info(`[${target.sell.api.getName()}][SELL][Fee Rate] ${target.sell.transactionFeeRate}`);
      logger.info(`[${target.sell.api.getName()}][SELL][Later Asset Coin] ${target.sell.laterAssetCoin}`);
      logger.info(`[${target.sell.api.getName()}][SELL][Later Asset Price] ${target.sell.laterAssetPrice}`);

      // Begin transactions
      const buyTransactionObj = {
        userId: this.userId,
        transactionId: buyTransactionId,
        ruleId: this.ruleId,
        arbitrageStrategy: this.arbitrageStrategy,
        siteName: target.buy.api.getName(),
        coinUnit: this.coinUnit,
        currencyUnit: this.currencyUnit,
        orderProcess: ORDER_PROCESSES.BUY,
        orderType: this.orderType,
        orderPrice: target.buy.orderPrice,
        orderAmount: target.buy.orderAmount,
        transactionFeeRate: target.buy.transactionFeeRate
      };
      const sellTransactionObj = {
        userId: this.userId,
        transactionId: sellTransactionId,
        ruleId: this.ruleId,
        arbitrageStrategy: this.arbitrageStrategy,
        siteName: target.sell.api.getName(),
        coinUnit: this.coinUnit,
        currencyUnit: this.currencyUnit,
        orderProcess: ORDER_PROCESSES.SELL,
        orderType: this.orderType,
        orderPrice: target.sell.orderPrice,
        orderAmount: target.sell.orderAmount,
        transactionFeeRate: target.sell.transactionFeeRate
      };

      // =>  INITIAL
      const buyTransaction = await transaction.initial(buyTransactionObj);
      const sellTransaction = await transaction.initial(sellTransactionObj);

      logger.debug('New transactions =>');
      logger.debug(buyTransaction);
      logger.debug(sellTransaction);

      // Begin buy transaction
      let buyOrderId;
      // => IN_PROGRESS
      const workingBuyTransaction = await transaction.in_progress(this.userId, buyTransactionId);

      logger.info(`Starting buy order to ${target.buy.api.getName()}...`);
      logger.debug('[Working transaction to buy]');
      logger.debug(workingBuyTransaction);

      try {
        buyOrderId = await retryPromise(
          target.buy.api.order,
          [ ORDER_PROCESSES.BUY, this.orderType, target.buy.orderPrice, target.buy.orderAmount ],
          orderRetryIntervalMSec,
          orderRetryTimes,
          target.buy.api
        );
      } catch (error) {
        const { errorCode, errorDetail } = parseError(error);

        if (buyOrderId) {
          await target.buy.api.cancelOrder(buyOrderId);
        }

        // => CANCELED
        const canceledBuyTransaction = await transaction.canceled(
          this.userId,
          buyTransactionId,
          errorCode,
          errorDetail
        );

        logger.warn(`Canceled ${target.buy.api.getName()}'s buy order successfuly because any api problem.`);
        logger.warn(new Error(error));
        logger.debug('[Canceled buy transaction]');
        logger.debug(canceledBuyTransaction);

        return result.cancellation();
      }

      // Begin sell transaction
      let sellOrderId;
      // => IN_PROGRESS
      const workingSellTransaction = await transaction.in_progress(this.userId, sellTransactionId);

      logger.info(`Starting sell order to ${target.sell.api.getName()}...`);
      logger.debug('[Working transaction to sell]');
      logger.debug(workingSellTransaction);

      try {
        sellOrderId = await retryPromise(
          target.sell.api.order,
          [ ORDER_PROCESSES.SELL, this.orderType, target.sell.orderPrice, target.sell.orderAmount ],
          orderRetryIntervalMSec,
          orderRetryTimes,
          target.sell.api
        );
      } catch (error) {
        const { errorCode, errorDetail } = parseError(error);

        if (buyOrderId) {
          await target.buy.api.cancelOrder(buyOrderId);
        }
        if (sellOrderId) {
          await target.sell.api.cancelOrder(sellOrderId);
        }

        // => CANCELED
        const canceledBuyTransaction = await transaction.canceled(
          this.userId,
          buyTransactionId,
          errorCode,
          errorDetail
        );
        const canceledSellTransaction = await transaction.canceled(
          this.userId,
          sellTransactionId,
          errorCode,
          errorDetail
        );

        logger.warn(
          `Canceled both ${target.buy.api.getName()}'s buy order and ${target.sell.api.getName()}'s sell order successfuly because any api problem.`
        );
        logger.warn(new Error(error));
        logger.debug('Canceled transactions =>');
        logger.debug(canceledBuyTransaction);
        logger.debug(canceledSellTransaction);

        return result.cancellation();
      }

      // Exit criteria to finish transactions
      const commitmentTimeLimitMSec = commitmentTimeLimitSec * 1000;
      await setTimeoutPromise(commitmentTimeLimitMSec);

      const isCompletedBuyOrder = await target.buy.api.isCompletedOrder(buyOrderId);
      const isCompletedSellOrder = await target.sell.api.isCompletedOrder(sellOrderId);

      if (isCompletedBuyOrder === false && isCompletedSellOrder === true) {
        // TODO: How to recover?
        await target.buy.api.cancelOrder(buyOrderId);
        // => CANCELED but only buy order
        const canceledBuyTransaction = await transaction.canceled(
          this.userId,
          buyTransactionId,
          ERROR_CODES.BUY_ORDER_TIMEOUT
        );
        // => SUCCEEDED but only sell order
        const succeededSellTransaction = await transaction.succeeded(this.userId, sellTransactionId);

        logger.warn(
          `Canceled ${target.buy.api.getName()}'s buy order but Succeeded ${target.sell.api.getName()}'s sell order because exceeded commitment time limit.`
        );
        logger.debug('[Canceled buy transaction]');
        logger.debug(canceledBuyTransaction);
        logger.debug('[Succeeded sell transaction]');
        logger.debug(succeededSellTransaction);

        return result.failure();
      } else if (isCompletedBuyOrder === true && isCompletedSellOrder === false) {
        // TODO: How to recover?
        await target.sell.api.cancelOrder(sellOrderId);
        // => SUCCEEDED but only buy order
        const succeededBuyTransaction = await transaction.succeeded(this.userId, buyTransactionId);
        // => CANCELED but only sell order
        const canceledSellTransaction = await transaction.canceled(
          this.userId,
          sellTransactionId,
          ERROR_CODES.SELL_ORDER_TIMEOUT
        );

        logger.warn(
          `Succeeded ${target.buy.api.getName()}'s buy order but Canceled ${target.sell.api.getName()}'s sell order because exceeded commitment time limit.`
        );
        logger.debug('[Succeeded sell transaction]');
        logger.debug(succeededBuyTransaction);
        logger.debug('[Canceled buy transaction]');
        logger.debug(canceledSellTransaction);

        return result.failure();
      } else if (isCompletedBuyOrder === false && isCompletedSellOrder === false) {
        await target.buy.api.cancelOrder(buyOrderId);
        await target.sell.api.cancelOrder(sellOrderId);
        // => CANCELED but both
        const canceledBuyTransaction = await transaction.canceled(
          this.userId,
          buyTransactionId,
          ERROR_CODES.BOTH_ORDERS_TIMEOUT
        );
        const canceledSellTransaction = await transaction.canceled(
          this.userId,
          sellTransactionId,
          ERROR_CODES.BOTH_ORDERS_TIMEOUT
        );

        logger.warn(
          `Canceled both ${target.buy.api.getName()}'s buy order and ${target.sell.api.getName()}'s sell order because exceeded commitment time limit.`
        );
        logger.debug('Canceled transactions =>');
        logger.debug(canceledBuyTransaction);
        logger.debug(canceledSellTransaction);

        return result.cancellation();
      } else {
        // => SUCCEEDED
        const succeededBuyTransaction = await transaction.succeeded(this.userId, buyTransactionId);
        const succeededSellTransaction = await transaction.succeeded(this.userId, sellTransactionId);

        logger.info(
          `Succeeded both ${target.buy.api.getName()}'s buy order and ${target.sell.api.getName()}'s sell order.`
        );
        logger.info(`[Decided profit] ${anticipatedProfit}`);
        logger.debug('Succeeded transactions =>');
        logger.debug(succeededBuyTransaction);
        logger.debug(succeededSellTransaction);

        return result.success(anticipatedProfit);
      }
    } catch (error) {
      const { errorCode, errorDetail } = parseError(error);

      // => FAILED
      const failedBuyTransaction = await transaction.failed(this.userId, buyTransactionId, errorCode, errorDetail);
      const failedSellTransaction = await transaction.failed(this.userId, sellTransactionId, errorCode, errorDetail);

      logger.error('Failed unexpectedly!');
      logger.error(new Error(error));
      logger.error('Failed transactions =>');
      logger.error(failedBuyTransaction);
      logger.error(failedSellTransaction);

      return result.failure();
    }
  }
}

module.exports = { SimpleArbitrageStrategy };
