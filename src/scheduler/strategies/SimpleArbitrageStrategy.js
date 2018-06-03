const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);
const uuid = require('uuid');
const moment = require('moment');
const { Transaction, ORDER_PROCESSES, TRANSACTION_STATES } = require('../../models/Transaction');
const Exchanges = {
  bitflyer: require('../exchanges/Bitflyer'),
  zaif: require('../exchanges/Zaif')
};
const { ERROR_CODES } = require('../exchanges/errors');

const result = {
  noTransaction: () => {
    return {
      additionalProfit: 0,
      additionalCounts: {
        executionCount: 1,
        successCount: 1,
        failureCount: 0,
        cancellationCount: 0
      }
    };
  },
  success: (profit) => {
    return {
      additionalProfit: profit,
      additionalCounts: {
        executionCount: 1,
        successCount: 1,
        failureCount: 0,
        cancellationCount: 0
      }
    };
  },
  failure: () => {
    return {
      additionalProfit: 0,
      additionalCounts: {
        executionCount: 1,
        successCount: 0,
        failureCount: 1,
        cancellationCount: 0
      }
    };
  },
  cancellation: () => {
    return {
      additionalProfit: 0,
      additionalCounts: {
        executionCount: 1,
        successCount: 0,
        failureCount: 0,
        cancellationCount: 1
      }
    };
  }
};

function calcExecutionTime(startTime) {
  return Date.now() - startTime;
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
    const startTime = Date.now();
    const buyTransactionId = uuid.v4();
    const sellTransactionId = uuid.v4();

    try {
      // Check working transactions
      const workingTransactions = await Transaction.query('ruleId')
        .eq(this.ruleId)
        .where('state')
        .eq(TRANSACTION_STATES.IN_PROGRESS)
        .exec();
      if (workingTransactions.length > 0) {
        console.log('Skipping...');
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
      console.log('BEST Bid A', bestBidPriceA);
      console.log('BEST Ask A', bestAskPriceA);
      console.log('BEST Ask A', bestAskAmountA);
      console.log('BEST Bid B', bestBidPriceB);
      console.log('BEST Ask B', bestAskPriceB);
      console.log('BEST Ask B', bestAskAmountB);

      // Compute transaction fees
      const transactionFeeRateA = await this.ExchangeA.getTransactionFeeRate();
      const transactionFeeRateB = await this.ExchangeB.getTransactionFeeRate();
      const bestBidFeeA = bestBidPriceA * transactionFeeRateA;
      const bestAskFeeA = bestAskPriceA * transactionFeeRateA;
      const bestBidFeeB = bestBidPriceB * transactionFeeRateB;
      const bestAskFeeB = bestAskPriceB * transactionFeeRateB;
      console.log('BEST FEE Rate B', transactionFeeRateA);
      console.log('BEST FEE Rate B', transactionFeeRateB);
      console.log('BEST Bid FEE A', bestBidFeeA);
      console.log('BEST Ask FEE A', bestAskFeeA);
      console.log('BEST Bid FEE B', bestBidFeeB);
      console.log('BEST Ask FEE B', bestAskFeeB);

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
      console.log('DIFF', Math.abs(bestBidPriceA - bestAskPriceB));
      console.log('########################');

      // Condition
      // A_Bid*(1 - A_FeeRate) - B_Ask*(1 - B_FeeRate) > (A_Bid*A_FeeRate) + (B_Ask*B_FeeRate)
      // => A_Bid - (A_Bid*A_FeeRate) - B_Ask + (B_Ask*B_FeeRate) > (A_Bid*A_FeeRate) + (B_Ask*B_FeeRate)
      // => A_Bid - A_BidFee - B_Ask + B_AskFee > A_BidFee + B_AskFee
      // => A_Bid - B_Ask - 2*A_BidFee > 0
      const isConditionedToBuyAskBAndSellBidA = bestBidPriceA - bestAskPriceB - 2 * bestBidFeeA > 0 ? true : false;
      const isConditionedToBuyAskAAndSellBidB = bestBidPriceB - bestAskPriceA - 2 * bestBidFeeB > 0 ? true : false;

      console.log('BUY B_ASK and SELL A_BID?', isConditionedToBuyAskBAndSellBidA);
      console.log(bestBidPriceA - bestAskPriceB - 2 * bestBidFeeA);
      console.log('BUY A_ASK and SELL B_BID?', isConditionedToBuyAskAAndSellBidB);
      console.log(bestBidPriceB - bestAskPriceA - 2 * bestBidFeeB);

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

        target = {
          buy: {
            api: this.ExchangeB,
            orderPrice: buyPrice,
            orderAmount: Math.floor(buyAmount * Math.pow(10, transactionDigit)) / Math.pow(10, transactionDigit),
            transactionFeeRate: transactionFeeRateB
          },
          sell: {
            api: this.ExchangeA,
            orderPrice: sellPrice,
            orderAmount: Math.floor(sellAmount * Math.pow(10, transactionDigit)) / Math.pow(10, transactionDigit),
            transactionFeeRate: transactionFeeRateA
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

        target = {
          buy: {
            api: this.ExchangeA,
            orderPrice: buyPrice,
            orderAmount: Math.floor(buyAmount * Math.pow(10, transactionDigit)) / Math.pow(10, transactionDigit),
            transactionFeeRate: transactionFeeRateA
          },
          sell: {
            api: this.ExchangeB,
            orderPrice: sellPrice,
            orderAmount: Math.floor(sellAmount * Math.pow(10, transactionDigit)) / Math.pow(10, transactionDigit),
            transactionFeeRate: transactionFeeRateB
          }
        };
      } else {
        console.log('NOOOOOOO Trade!!! NOOOO Match Condition');
        return result.noTransaction();
      }

      if (target.buy.orderAmount < transactionMinAmount) {
        console.log('NOOOOOOO Trade!!! TOOO MIN');
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
      const executionTime = calcExecutionTime(startTime);
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
        transactionFeeRate: target.buy.transactionFeeRate,
        executionTime
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
        transactionFeeRate: target.sell.transactionFeeRate,
        executionTime
      };
      const newBuyTransaction = new Transaction(buyTransactionObj);
      const newSellTransaction = new Transaction(sellTransactionObj);
      // =>  INITIAL
      const buyTransaction = await newBuyTransaction.save({ overwrite: false });
      const sellTransaction = await newSellTransaction.save({ overwrite: false });
      console.log('-------------------------');
      console.log(buyTransaction);
      console.log(sellTransaction);
      console.log('-------------------------');

      // Begin buy transaction
      let buyOrderId;
      // =>  IN_PROGRESS
      const workingBuyTransaction = await Transaction.update(
        { userId: this.userId, transactionId: buyTransactionId },
        { $PUT: { state: TRANSACTION_STATES.IN_PROGRESS } }
      );
      console.log('-------------------------');
      console.log(workingBuyTransaction);
      console.log('-------------------------');
      try {
        console.log('##### BUY ORDER #####', target.buy.api.getName());
        buyOrderId = await target.buy.api.order(
          ORDER_PROCESSES.BUY,
          this.orderType,
          target.buy.orderPrice,
          target.buy.orderAmount
        );
        console.log('orderId', buyOrderId);
      } catch (error) {
        if (buyOrderId) {
          await target.buy.api.cancelOrder(buyOrderId);
          console.log('BUY CANCELED', buyOrderId);
        }
        // =>  CANCELED
        const executionTime = calcExecutionTime(startTime);
        const modifiedAt = moment().toISOString();
        const canceledBuyTransaction = await Transaction.update(
          { userId: this.userId, transactionId: buyTransactionId },
          {
            $PUT: {
              state: TRANSACTION_STATES.CANCELED,
              modifiedAt,
              executionTime,
              errorCode: ERROR_CODES.ORDERS_FAILURE
            }
          }
        );
        console.log('-------------------------');
        console.log('Exec Time: ', executionTime);
        console.log('modifiedAt: ', modifiedAt);
        console.log(canceledBuyTransaction);
        console.log('-------------------------');
        return result.cancellation();
      }

      // Begin sell transaction
      let sellOrderId;
      const workingSellTransaction = await Transaction.update(
        { userId: this.userId, transactionId: sellTransactionId },
        { $PUT: { state: TRANSACTION_STATES.IN_PROGRESS } }
      );
      console.log('-------------------------');
      console.log(workingSellTransaction);
      console.log('-------------------------');
      try {
        console.log('##### SELL ORDER #####', target.sell.api.getName());
        sellOrderId = await target.sell.api.order(
          ORDER_PROCESSES.SELL,
          this.orderType,
          target.sell.orderPrice,
          target.sell.orderAmount
        );
        console.log('orderId', sellOrderId);
      } catch (error) {
        if (buyOrderId) {
          await target.buy.api.cancelOrder(buyOrderId);
          console.log('BUY CANCELED', buyOrderId);
        }
        if (sellOrderId) {
          await target.sell.api.cancelOrder(sellOrderId);
          console.log('SELL CANCELED', sellOrderId);
        }
        // =>  CANCELED
        const executionTime = calcExecutionTime(startTime);
        const modifiedAt = moment().toISOString();
        const canceledBuyTransaction = await Transaction.update(
          { userId: this.userId, transactionId: buyTransactionId },
          {
            $PUT: {
              state: TRANSACTION_STATES.CANCELED,
              modifiedAt,
              executionTime,
              errorCode: ERROR_CODES.ORDERS_FAILURE
            }
          }
        );
        const canceledSellTransaction = await Transaction.update(
          { userId: this.userId, transactionId: sellTransactionId },
          {
            $PUT: {
              state: TRANSACTION_STATES.CANCELED,
              modifiedAt,
              executionTime,
              errorCode: ERROR_CODES.ORDERS_FAILURE
            }
          }
        );
        console.log('-------------------------');
        console.log('Exec Time: ', executionTime);
        console.log('modifiedAt: ', modifiedAt);
        console.log(canceledBuyTransaction);
        console.log(canceledSellTransaction);
        console.log('-------------------------');
        return result.cancellation();
      }

      // Exit criteria to finish transactions
      const commitmentTimeLimitMSec = this.commitmentTimeLimit * 1000;
      await setTimeoutPromise(commitmentTimeLimitMSec, async () => {
        const isCompletedBuyOrder = await target.buy.api.isCompletedOrder(buyOrderId);
        const isCompletedSellOrder = await target.sell.api.isCompletedOrder(sellOrderId);

        if (isCompletedBuyOrder === false && isCompletedSellOrder === true) {
          // TODO: How to recover?
          await target.buy.api.cancelOrder(buyOrderId);
          console.log('BUY CANCELED TO STOP', buyOrderId);
          // => CANCELED but only buy order
          const executionTime = calcExecutionTime(startTime);
          const modifiedAt = moment().toISOString();
          const canceledBuyTransaction = await Transaction.update(
            { userId: this.userId, transactionId: buyTransactionId },
            {
              $PUT: {
                state: TRANSACTION_STATES.CANCELED,
                modifiedAt,
                executionTime,
                errorCode: ERROR_CODES.BUY_ORDER_TIMEOUT
              }
            }
          );
          const succeededSellTransaction = await Transaction.update(
            { userId: this.userId, transactionId: sellTransactionId },
            { $PUT: { state: TRANSACTION_STATES.SUCCEEDED, modifiedAt, executionTime } }
          );
          console.log('-------------------------');
          console.log('Exec Time: ', executionTime);
          console.log('modifiedAt: ', modifiedAt);
          console.log(canceledBuyTransaction);
          console.log(succeededSellTransaction);
          console.log('-------------------------');
          return result.failure();
        } else if (isCompletedBuyOrder === true && isCompletedSellOrder === false) {
          // TODO: How to recover?
          await target.sell.api.cancelOrder(sellOrderId);
          console.log('SELL CANCELED TO STOP', sellOrderId);
          // => CANCELED but only sell order
          const executionTime = calcExecutionTime(startTime);
          const modifiedAt = moment().toISOString();
          const succeededBuyTransaction = await Transaction.update(
            { userId: this.userId, transactionId: buyTransactionId },
            { $PUT: { state: TRANSACTION_STATES.SUCCEEDED, modifiedAt, executionTime } }
          );
          const canceledSellTransaction = await Transaction.update(
            { userId: this.userId, transactionId: sellTransactionId },
            {
              $PUT: {
                state: TRANSACTION_STATES.CANCELED,
                modifiedAt,
                executionTime,
                errorCode: ERROR_CODES.BUY_ORDER_TIMEOUT
              }
            }
          );
          console.log('-------------------------');
          console.log('Exec Time: ', executionTime);
          console.log('modifiedAt: ', modifiedAt);
          console.log(succeededBuyTransaction);
          console.log(canceledSellTransaction);
          console.log('-------------------------');
          return result.failure();
        } else if (isCompletedBuyOrder === false && isCompletedSellOrder === false) {
          await target.buy.api.cancelOrder(buyOrderId);
          await target.sell.api.cancelOrder(sellOrderId);
          console.log('BUY CANCELED', buyOrderId);
          console.log('SELL CANCELED', sellOrderId);
          // =>  CANCELED but both
          const executionTime = calcExecutionTime(startTime);
          const modifiedAt = moment().toISOString();
          const canceledBuyTransaction = await Transaction.update(
            { userId: this.userId, transactionId: buyTransactionId },
            {
              $PUT: {
                state: TRANSACTION_STATES.CANCELED,
                modifiedAt,
                executionTime,
                errorCode: ERROR_CODES.BOTH_ORDERS_TIMEOUT
              }
            }
          );
          const canceledSellTransaction = await Transaction.update(
            { userId: this.userId, transactionId: sellTransactionId },
            {
              $PUT: {
                state: TRANSACTION_STATES.CANCELED,
                modifiedAt,
                executionTime,
                errorCode: ERROR_CODES.BOTH_ORDERS_TIMEOUT
              }
            }
          );
          console.log('-------------------------');
          console.log('Exec Time: ', executionTime);
          console.log('modifiedAt: ', modifiedAt);
          console.log(canceledBuyTransaction);
          console.log(canceledSellTransaction);
          console.log('-------------------------');
          return result.cancellation();
        } else {
          // => DONE
          const executionTime = calcExecutionTime(startTime);
          const modifiedAt = moment().toISOString();
          const succeededBuyTransaction = await Transaction.update(
            { userId: this.userId, transactionId: buyTransactionId },
            { $PUT: { state: TRANSACTION_STATES.SUCCEEDED, modifiedAt, executionTime } }
          );
          const succeededSellTransaction = await Transaction.update(
            { userId: this.userId, transactionId: sellTransactionId },
            { $PUT: { state: TRANSACTION_STATES.SUCCEEDED, modifiedAt, executionTime } }
          );
          console.log('-------------------------');
          console.log('Exec Time: ', executionTime);
          console.log('modifiedAt: ', modifiedAt);
          console.log(succeededBuyTransaction);
          console.log(succeededSellTransaction);
          console.log('-------------------------');
          return result.success(anticipatedProfit);
        }
      });
    } catch (error) {
      if (!error.code) {
        // FATAL: database error or bugs
        // => FAILED
        const executionTime = calcExecutionTime(startTime);
        const modifiedAt = moment().toISOString();
        const failedBuyTransaction = await Transaction.update(
          { userId: this.userId, transactionId: buyTransactionId },
          {
            $PUT: {
              state: TRANSACTION_STATES.FAILED,
              modifiedAt,
              executionTime,
              errorCode: ERROR_CODES.UNKNOWN_ERROR
            }
          }
        );
        const failedSellTransaction = await Transaction.update(
          { userId: this.userId, transactionId: sellTransactionId },
          {
            $PUT: {
              state: TRANSACTION_STATES.FAILED,
              modifiedAt,
              executionTime,
              errorCode: ERROR_CODES.UNKNOWN_ERROR
            }
          }
        );
        console.log('-------------------------');
        console.log('Exec Time: ', executionTime);
        console.log('modifiedAt: ', modifiedAt);
        console.log(failedBuyTransaction);
        console.log(failedSellTransaction);
        console.log('-------------------------');
        return result.failure();
      } else if (error.code === ERROR_CODES.NETWORK_ERROR) {
        // => FAILED
        const executionTime = calcExecutionTime(startTime);
        const modifiedAt = moment().toISOString();
        const failedBuyTransaction = await Transaction.update(
          { userId: this.userId, transactionId: buyTransactionId },
          {
            $PUT: {
              state: TRANSACTION_STATES.FAILED,
              modifiedAt,
              executionTime,
              errorCode: ERROR_CODES.NETWORK_ERROR
            }
          }
        );
        const failedSellTransaction = await Transaction.update(
          { userId: this.userId, transactionId: sellTransactionId },
          {
            $PUT: {
              state: TRANSACTION_STATES.FAILED,
              modifiedAt,
              executionTime,
              errorCode: ERROR_CODES.NETWORK_ERROR
            }
          }
        );
        console.log('-------------------------');
        console.log('Exec Time: ', executionTime);
        console.log('modifiedAt: ', modifiedAt);
        console.log(failedBuyTransaction);
        console.log(failedSellTransaction);
        console.log('-------------------------');
        return result.failure();
      } else if (error.code === ERROR_CODES.API_TEMPORARILY_UNAVAILABLE) {
        // => FAILED
        const executionTime = calcExecutionTime(startTime);
        const modifiedAt = moment().toISOString();
        const failedBuyTransaction = await Transaction.update(
          { userId: this.userId, transactionId: buyTransactionId },
          {
            $PUT: {
              state: TRANSACTION_STATES.FAILED,
              modifiedAt,
              executionTime,
              errorCode: ERROR_CODES.API_TEMPORARILY_UNAVAILABLE
            }
          }
        );
        const failedSellTransaction = await Transaction.update(
          { userId: this.userId, transactionId: sellTransactionId },
          {
            $PUT: {
              state: TRANSACTION_STATES.FAILED,
              modifiedAt,
              executionTime,
              errorCode: ERROR_CODES.API_TEMPORARILY_UNAVAILABLE
            }
          }
        );
        console.log('-------------------------');
        console.log('Exec Time: ', executionTime);
        console.log('modifiedAt: ', modifiedAt);
        console.log(failedBuyTransaction);
        console.log(failedSellTransaction);
        console.log('-------------------------');
        return result.failure();
      } else {
        // API_FAILURE
        // => FAILED
        const executionTime = calcExecutionTime(startTime);
        const modifiedAt = moment().toISOString();
        const failedBuyTransaction = await Transaction.update(
          { userId: this.userId, transactionId: buyTransactionId },
          {
            $PUT: {
              state: TRANSACTION_STATES.FAILED,
              modifiedAt,
              executionTime,
              errorCode: ERROR_CODES.API_FAILURE
            }
          }
        );
        const failedSellTransaction = await Transaction.update(
          { userId: this.userId, transactionId: sellTransactionId },
          {
            $PUT: {
              state: TRANSACTION_STATES.FAILED,
              modifiedAt,
              executionTime,
              errorCode: ERROR_CODES.API_FAILURE
            }
          }
        );
        console.log('-------------------------');
        console.log('Exec Time: ', executionTime);
        console.log('modifiedAt: ', modifiedAt);
        console.log(failedBuyTransaction);
        console.log(failedSellTransaction);
        console.log('-------------------------');
        return result.failure();
      }
    }
  }
}

module.exports = { SimpleArbitrageStrategy };
