const uuid = require('uuid');
const moment = require('moment');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;
const { ARBITRAGE_STRATEGIES, ORDER_TYPES, COIN_UNITS, CURRENCY_UNITS, EXCHANGE_SITES } = require('./Rule');

const TRANSACTION_STATES = {
  INITIAL: 'initial',
  BUYING: 'buying',
  SENDING: 'sending',
  SELLING: 'selling',
  PENDING_TO_BUY: 'pending_to_buy',
  PENDING_TO_SEND: 'pending_to_send',
  PENDING_TO_SELL: 'pending_to_sell',
  SUCCEEDED: 'succeeded',
  FAILED_TO_BUY: 'failed_to_buy',
  FAILED_TO_SEND: 'failed_to_send',
  FAILED_TO_SELL: 'failed_to_sell'
};

const options = {
  timestamps: true,
  useNativeBooleans: true,
  useDocumentTypes: true
};

const transactionSchema = new Schema(
  {
    id: { type: String, hashKey: true, default: () => uuid.v4() },
    userId: { type: String, required: true, trim: true },
    ruleId: { type: String, required: true, trim: true },
    arbitrageStrategy: {
      type: String,
      required: true,
      validate: (value) => Object.values(ARBITRAGE_STRATEGIES).indexOf(value) !== -1
    },
    source: {
      name: {
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
        validate: (value) => (value > 0 ? true : false)
      },
      orderPrice: {
        type: Number,
        required: true,
        validate: (value) => (value > 0 ? true : false)
      },
      orderPriority: { type: Number, required: true, default: 0 }
    },
    destination: {
      name: {
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
        validate: (value) => (value > 0 ? true : false)
      },
      orderPrice: {
        type: Number,
        required: true,
        validate: (value) => (value > 0 ? true : false)
      },
      orderPriority: { type: Number, required: true, default: 0 }
    },
    state: {
      type: String,
      required: true,
      default: TRANSACTION_STATES.INITIAL,
      validate: (value) => Object.values(TRANSACTION_STATES).indexOf(value) !== -1
    },
    modifiedAt: {
      type: Date,
      required: true,
      default: () => moment().toISOString()
    },
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
  TRANSACTION_STATES,
  Transaction
};
