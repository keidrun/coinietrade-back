const moment = require('moment');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;
const { ARBITRAGE_STRATEGIES, EXCHANGE_SITES, ORDER_TYPES, COIN_UNITS, CURRENCY_UNITS } = require('./Rule');

const TRANSACTION_PROCESSES = {
  BUY: 'buy',
  SELL: 'sell'
};

const TRANSACTION_STATES = {
  INITIAL: 'initial',
  IN_PROGRESS: 'in_progress',
  SUCCEEDED: 'succeeded',
  CANCELED: 'canceled',
  FAILED: 'failed'
};

const ERROR_REASONS = {
  // canceled
  ASSET_SHORTAGE: 'Asset shortage',
  TRANSACTION_TIMEOUT: 'Transaction timeout',
  // failed
  API_CONNECTION_FAILED: 'API connection failed',
  API_ORDER_REQUEST_FAILED: 'Order request failed',
  API_CANCEL_REQUEST_FAILED: 'Cancel request failed',
  UNMATCHED_TRANSACTION_FAILED: 'Unmatched transaction failed',
  // Both
  UNKNOWN_REASON: 'Unkown reason'
};

const options = {
  timestamps: true,
  useNativeBooleans: true,
  useDocumentTypes: true
};

const transactionSchema = new Schema(
  {
    id: { type: String, hashKey: true, trim: true },
    process: {
      type: String,
      rangeKey: true,
      required: true,
      validate: (value) => Object.values(TRANSACTION_PROCESSES).indexOf(value) !== -1
    },
    userId: { type: String, required: true, trim: true },
    ruleId: { type: String, required: true, trim: true },
    arbitrageStrategy: {
      type: String,
      required: true,
      validate: (value) => Object.values(ARBITRAGE_STRATEGIES).indexOf(value) !== -1
    },
    siteName: {
      type: String,
      required: true,
      validate: (value) => Object.values(EXCHANGE_SITES).indexOf(value) !== -1
    },
    coinUnit: {
      type: String,
      required: true,
      validate: (value) => Object.values(COIN_UNITS).indexOf(value) !== -1
    },
    currencyUnit: {
      type: String,
      required: true,
      validate: (value) => Object.values(CURRENCY_UNITS).indexOf(value) !== -1
    },
    orderType: {
      type: String,
      required: true,
      default: ORDER_TYPES.LIMIT_ORDER,
      validate: (value) => Object.values(ORDER_TYPES).indexOf(value) !== -1
    },
    orderAmount: {
      type: Number,
      required: true,
      validate: (value) => (value >= 0 ? true : false)
    },
    orderPrice: {
      type: Number,
      validate: (value) => (value >= 0 ? true : false)
    },
    expectedTransactionFee: { type: Number, required: true },
    expectedProfitPrice: { type: Number, required: true },
    state: {
      type: String,
      required: true,
      default: TRANSACTION_STATES.INITIAL,
      validate: (value) => Object.values(TRANSACTION_STATES).indexOf(value) !== -1
    },
    reason: {
      type: String,
      validate: (value) => Object.values(ERROR_REASONS).indexOf(value) !== -1
    },
    modifiedAt: { type: Date, required: true, default: () => moment().toISOString() },
    version: { type: Number, required: true, default: 0 }
  },
  options
);

transactionSchema.statics.getAll = async function() {
  let results = await this.scan().exec();
  while (results.lastKey) {
    results = await this.scan().startKey(results.startKey).exec();
  }
  return results;
};

const Transaction = dynamoose.model('transactions', transactionSchema);

module.exports = {
  TRANSACTION_PROCESSES,
  TRANSACTION_STATES,
  ERROR_REASONS,
  Transaction
};
