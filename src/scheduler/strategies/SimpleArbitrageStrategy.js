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

const lockedTransactionsReleaseTimeSec = process.env.LOCKED_TRANSACTIONS_RELEASE_TIME_SEC;

const parseError = (error) => {
  let errorCode, errorDetail;
  if (!error.code) {
    // FATAL: database error or bugs
    errorCode = ERROR_CODES.UNKNOWN_ERROR;
    errorDetail = error.toString();
  } else if (error.code === ERROR_CODES.NETWORK_ERROR) {
    errorCode = ERROR_CODES.NETWORK_ERROR;
    errorDetail = error.message;
  } else if (error.code === ERROR_CODES.API_UNAUTHORIZED) {
    errorCode = ERROR_CODES.API_UNAUTHORIZED;
    errorDetail = error.message;
  } else if (error.code === ERROR_CODES.API_TEMPORARILY_UNAVAILABLE) {
    errorCode = ERROR_CODES.API_TEMPORARILY_UNAVAILABLE;
    errorDetail = error.message;
  } else {
    errorCode = ERROR_CODES.API_FAILURE;
    errorDetail = error.message;
  }
  return { errorCode, errorDetail };
};

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
    this.commitmentTimeLimit = argsObj.commitmentTimeLimit;
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
      // Check working transactions
      const workingTransactions = await transaction.getWorking(this.ruleId);
      if (workingTransactions.length > 0) {
        // Release locked transactions
        workingTransactions.forEach(async (lockedTransaction) => {
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
            console.log('-------------------------');
            console.log('Release transactions');
            console.log(releasedTransaction);
            console.log('-------------------------');
          }
        });

        console.log('-------------------------');
        console.log('Skipping...');
        console.log('-------------------------');
        return result.noTransaction();
      }

      console.log('##### arguments #####');
      console.log('userId', this.userId);
      console.log('ruleId', this.ruleId);
      console.log('arbitrageStrategy', this.arbitrageStrategy);
      console.log('coinUnit', this.coinUnit);
      console.log('currencyUnit', this.currencyUnit);
      console.log('orderType', this.orderType);
      console.log('assetRange', this.assetRange);
      console.log('assetMinLimit', this.assetMinLimit);
      console.log('commitmentTimeLimit', this.commitmentTimeLimit);
      console.log('buyWeightRate', this.buyWeightRate);
      console.log('sellWeightRate', this.sellWeightRate);
      console.log('####################');

      // Compute best bid and best ask
      const boardA = await this.ExchangeA.getSortedBoard();
      const bestBidPriceA = boardA.bids[0].price;
      const bestAskPriceA = boardA.asks[0].price;
      const bestAskAmountA = boardA.asks[0].amount;
      const boardB = await this.ExchangeB.getSortedBoard();
      const bestBidPriceB = boardB.bids[0].price;
      const bestAskPriceB = boardB.asks[0].price;
      const bestAskAmountB = boardB.asks[0].amount;
      console.log('-------------------------');
      console.log('BEST Bid A', bestBidPriceA);
      console.log('BEST Ask A', bestAskPriceA);
      console.log('BEST Ask A', bestAskAmountA);
      console.log('BEST Bid B', bestBidPriceB);
      console.log('BEST Ask B', bestAskPriceB);
      console.log('BEST Ask B', bestAskAmountB);
      console.log('-------------------------');

      // Compute transaction fees
      const transactionFeeRateA = await this.ExchangeA.getTransactionFeeRate();
      const transactionFeeRateB = await this.ExchangeB.getTransactionFeeRate();
      const bestBidFeeA = bestBidPriceA * transactionFeeRateA;
      const bestAskFeeA = bestAskPriceA * transactionFeeRateA;
      const bestBidFeeB = bestBidPriceB * transactionFeeRateB;
      const bestAskFeeB = bestAskPriceB * transactionFeeRateB;
      console.log('-------------------------');
      console.log('BEST FEE Rate B', transactionFeeRateA);
      console.log('BEST FEE Rate B', transactionFeeRateB);
      console.log('BEST Bid FEE A', bestBidFeeA);
      console.log('BEST Ask FEE A', bestAskFeeA);
      console.log('BEST Bid FEE B', bestBidFeeB);
      console.log('BEST Ask FEE B', bestAskFeeB);
      console.log('-------------------------');

      // Compute transaction minimum amount and digit
      const transactionMinAmountA = this.ExchangeA.getTransactionMinAmount();
      const transactionMinAmountB = this.ExchangeB.getTransactionMinAmount();
      const transactionMinAmount =
        transactionMinAmountA > transactionMinAmountB ? transactionMinAmountA : transactionMinAmountB;
      const transactionDigit = String(transactionMinAmount).split('.')[1].length;

      // Compute trade limits
      const assetsAmountsA = await this.ExchangeA.getAssets();
      const assetsAmountsB = await this.ExchangeB.getAssets();
      const possiblePriceLimitA = assetsAmountsA.presentCurrencyAmount * this.assetRange;
      const possibleCoinAmountLimitA = assetsAmountsA.presentCoinAmount * this.assetRange;
      const possiblePriceLimitB = assetsAmountsB.presentCurrencyAmount * this.assetRange;
      const possibleCoinAmountLimitB = assetsAmountsB.presentCoinAmount * this.assetRange;
      console.log(`####### ${this.ExchangeA.getName()} ##########`);
      console.log('BTC limit', possibleCoinAmountLimitA);
      console.log('JPY limit', possiblePriceLimitA);
      console.log(`####### ${this.ExchangeB.getName()} ##########`);
      console.log('BTC limit', possibleCoinAmountLimitB);
      console.log('JPY limit', possiblePriceLimitB);
      console.log('########################');
      console.log('DIFF BidA-AskB', bestBidPriceA - bestAskPriceB);
      console.log('DIFF BidB-AskA', bestBidPriceB - bestAskPriceA);
      console.log('########################');

      // Condition
      // A_Bid*(1 - A_FeeRate) - B_Ask*(1 - B_FeeRate) > (A_Bid*A_FeeRate) + (B_Ask*B_FeeRate)
      // => A_Bid - (A_Bid*A_FeeRate) - B_Ask + (B_Ask*B_FeeRate) > (A_Bid*A_FeeRate) + (B_Ask*B_FeeRate)
      // => A_Bid - A_BidFee - B_Ask + B_AskFee > A_BidFee + B_AskFee
      // => A_Bid - B_Ask - 2*A_BidFee > 0
      const isConditionedToBuyAskBAndSellBidA = bestBidPriceA - bestAskPriceB - 2 * bestBidFeeA > 0 ? true : false;
      const isConditionedToBuyAskAAndSellBidB = bestBidPriceB - bestAskPriceA - 2 * bestBidFeeB > 0 ? true : false;

      console.log('-------------------------');
      console.log('BUY B_ASK and SELL A_BID?', isConditionedToBuyAskBAndSellBidA);
      console.log('BUY A_ASK and SELL B_BID?', isConditionedToBuyAskAAndSellBidB);
      console.log('-------------------------');

      // Compute target to buy and sell
      let target;
      if (isConditionedToBuyAskBAndSellBidA) {
        const buyPrice = bestAskPriceB * (1 + this.buyWeightRate);
        const sellPrice = bestBidPriceA * (1 + this.sellWeightRate);

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

        console.log('-------------------------');
        console.log('buyAmount', buyAmount);
        console.log('fixedBuyAmount', fixedBuyAmount);
        console.log('sellAmount', sellAmount);
        console.log('fixedSellAmount', fixedSellAmount);
        console.log('-------------------------');

        target = {
          buy: {
            api: this.ExchangeB,
            orderPrice: buyPrice,
            orderAmount: fixedBuyAmount,
            transactionFeeRate: transactionFeeRateB,
            laterAssetPrice:
              assetsAmountsB.presentCurrencyAmount - buyPrice * fixedBuyAmount * (1 + transactionFeeRateB)
          },
          sell: {
            api: this.ExchangeA,
            orderPrice: sellPrice,
            orderAmount: fixedSellAmount,
            transactionFeeRate: transactionFeeRateA,
            laterAssetPrice:
              assetsAmountsA.presentCurrencyAmount + sellPrice * fixedSellAmount * (1 + transactionFeeRateA)
          }
        };
      } else if (isConditionedToBuyAskAAndSellBidB) {
        const buyPrice = bestAskPriceA * (1 + this.buyWeightRate);
        const sellPrice = bestBidPriceB * (1 + this.sellWeightRate);

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

        console.log('-------------------------');
        console.log('buyAmount', buyAmount);
        console.log('fixedBuyAmount', fixedBuyAmount);
        console.log('sellAmount', sellAmount);
        console.log('fixedSellAmount', fixedSellAmount);
        console.log('-------------------------');

        target = {
          buy: {
            api: this.ExchangeA,
            orderPrice: buyPrice,
            orderAmount: Math.floor(buyAmount * Math.pow(10, transactionDigit)) / Math.pow(10, transactionDigit),
            transactionFeeRate: transactionFeeRateA,
            laterAssetPrice:
              assetsAmountsA.presentCurrencyAmount - buyPrice * fixedBuyAmount * (1 + transactionFeeRateA)
          },
          sell: {
            api: this.ExchangeB,
            orderPrice: sellPrice,
            orderAmount: Math.floor(sellAmount * Math.pow(10, transactionDigit)) / Math.pow(10, transactionDigit),
            transactionFeeRate: transactionFeeRateB,
            laterAssetPrice:
              assetsAmountsB.presentCurrencyAmount + sellPrice * fixedSellAmount * (1 + transactionFeeRateB)
          }
        };
      } else {
        console.log('-------------------------');
        console.log('NOOOOOOO Trade!!! NOOOO Match Condition');
        console.log('-------------------------');
        return result.noTransaction();
      }

      console.log('-------------------------');
      console.log('transactionMinAmount', transactionMinAmount);
      console.log('target.buy.orderAmount', target.buy.orderAmount);
      console.log('assetMinLimit', this.assetMinLimit);
      console.log('target.buy.laterAssetPrice', target.buy.laterAssetPrice);
      console.log('-------------------------');

      if (target.buy.laterAssetPrice < this.assetMinLimit) {
        console.log('-------------------------');
        console.log('NOOOOOOO Trade!!! OVER ASSET MIN LIMIT');
        console.log('-------------------------');
        return result.noTransaction();
      }

      if (target.buy.orderAmount < transactionMinAmount) {
        console.log('-------------------------');
        console.log('NOOOOOOO Trade!!! TOO MIN');
        console.log('-------------------------');
        return result.noTransaction();
      }

      const anticipatedProfit = Math.floor(
        target.sell.orderPrice * target.sell.orderAmount * (1 - target.sell.transactionFeeRate) -
          target.buy.orderPrice * target.buy.orderAmount * (1 - target.buy.transactionFeeRate)
      );

      console.log('########################');
      console.log(target);
      console.log('BUY', 'name', target.buy.api.getName());
      console.log('BUY', 'price', target.buy.orderPrice);
      console.log('BUY', 'amount', target.buy.orderAmount);
      console.log('BUY', 'feeRate', target.buy.transactionFeeRate);
      console.log('SELL', 'name', target.sell.api.getName());
      console.log('SELL', 'price', target.sell.orderPrice);
      console.log('SELL', 'amount', target.sell.orderAmount);
      console.log('SELL', 'feeRate', target.sell.transactionFeeRate);
      console.log('anticipatedProfit', anticipatedProfit);
      console.log('########################');

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
      console.log('-------------------------');
      console.log(buyTransaction);
      console.log(sellTransaction);
      console.log('-------------------------');

      // Begin buy transaction
      let buyOrderId;
      // => IN_PROGRESS
      const workingBuyTransaction = await transaction.in_progress(this.userId, buyTransactionId);
      console.log('##### BUY ORDER #####', target.buy.api.getName());
      console.log('-------------------------');
      console.log(workingBuyTransaction);
      console.log('-------------------------');
      try {
        buyOrderId = await target.buy.api.order(
          ORDER_PROCESSES.BUY,
          this.orderType,
          target.buy.orderPrice,
          target.buy.orderAmount
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
        console.log('-------------------------');
        console.log(canceledBuyTransaction);
        console.log(error);
        console.log('-------------------------');
        return result.cancellation();
      }

      // Begin sell transaction
      let sellOrderId;
      // => IN_PROGRESS
      const workingSellTransaction = await transaction.in_progress(this.userId, sellTransactionId);
      console.log('##### SELL ORDER #####', target.sell.api.getName());
      console.log('-------------------------');
      console.log(workingSellTransaction);
      console.log('-------------------------');
      try {
        sellOrderId = await target.sell.api.order(
          ORDER_PROCESSES.SELL,
          this.orderType,
          target.sell.orderPrice,
          target.sell.orderAmount
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
        console.log('-------------------------');
        console.log(canceledBuyTransaction);
        console.log(canceledSellTransaction);
        console.log(error);
        console.log('-------------------------');
        return result.cancellation();
      }

      // Exit criteria to finish transactions
      const commitmentTimeLimitMSec = this.commitmentTimeLimit * 1000;
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
        console.log('-------------------------');
        console.log(canceledBuyTransaction);
        console.log(succeededSellTransaction);
        console.log('-------------------------');
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
        console.log('-------------------------');
        console.log(succeededBuyTransaction);
        console.log(canceledSellTransaction);
        console.log('-------------------------');
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
        console.log('-------------------------');
        console.log(canceledBuyTransaction);
        console.log(canceledSellTransaction);
        console.log('-------------------------');
        return result.cancellation();
      } else {
        // => SUCCEEDED
        const succeededBuyTransaction = await transaction.succeeded(this.userId, buyTransactionId);
        const succeededSellTransaction = await transaction.succeeded(this.userId, sellTransactionId);
        console.log('-------------------------');
        console.log(succeededBuyTransaction);
        console.log(succeededSellTransaction);
        console.log('-------------------------');
        return result.success(anticipatedProfit);
      }
    } catch (error) {
      const { errorCode, errorDetail } = parseError(error);

      // => FAILED
      const failedBuyTransaction = await transaction.failed(this.userId, buyTransactionId, errorCode, errorDetail);
      const failedSellTransaction = await transaction.failed(this.userId, sellTransactionId, errorCode, errorDetail);
      console.log('-------------------------');
      console.log(failedBuyTransaction);
      console.log(failedSellTransaction);
      console.log(error);
      console.log('-------------------------');
      return result.failure();
    }
  }
}

module.exports = { SimpleArbitrageStrategy };
