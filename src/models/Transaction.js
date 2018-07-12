const uuid = require('uuid');
const moment = require('moment');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;
const {
  ARBITRAGE_STRATEGIES,
  EXCHANGE_SITES,
  ORDER_TYPES,
  COIN_UNITS,
  CURRENCY_UNITS,
} = require('./Rule');
const { ERROR_CODES } = require('../scheduler/exchanges/errors.js');

const ORDER_PROCESSES = {
  BUY: 'buy',
  SELL: 'sell',
};

const TRANSACTION_STATES = {
  INITIAL: 'initial',
  IN_PROGRESS: 'in_progress',
  SUCCEEDED: 'succeeded',
  CANCELED: 'canceled',
  FAILED: 'failed',
};

const options = {
  timestamps: true,
  useNativeBooleans: true,
  useDocumentTypes: true,
};

const transactionSchema = new Schema(
  {
    userId: {
      type: String,
      hashKey: true,
      required: true,
      trim: true,
    },
    transactionId: {
      type: String,
      rangeKey: true,
      default: () => uuid.v4(),
    },
    ruleId: {
      type: String,
      index: {
        global: true,
        rangeKey: 'state',
        name: 'ruleIdIndex',
        project: true,
      },
      required: true,
      trim: true,
    },
    arbitrageStrategy: {
      type: String,
      required: true,
      validate: value =>
        Object.values(ARBITRAGE_STRATEGIES).indexOf(value) !== -1,
    },
    siteName: {
      type: String,
      required: true,
      validate: value => Object.values(EXCHANGE_SITES).indexOf(value) !== -1,
    },
    coinUnit: {
      type: String,
      required: true,
      validate: value => Object.values(COIN_UNITS).indexOf(value) !== -1,
    },
    currencyUnit: {
      type: String,
      required: true,
      validate: value => Object.values(CURRENCY_UNITS).indexOf(value) !== -1,
    },
    orderProcess: {
      type: String,
      required: true,
      validate: value => Object.values(ORDER_PROCESSES).indexOf(value) !== -1,
    },
    orderType: {
      type: String,
      required: true,
      default: ORDER_TYPES.LIMIT_ORDER,
      validate: value => Object.values(ORDER_TYPES).indexOf(value) !== -1,
    },
    orderPrice: {
      type: Number,
      required: true,
      validate: value => (value >= 0 ? true : false),
    },
    orderAmount: {
      type: Number,
      required: true,
      validate: value => (value >= 0 ? true : false),
    },
    transactionFeeRate: { type: Number, required: true },
    state: {
      type: String,
      required: true,
      default: TRANSACTION_STATES.INITIAL,
      validate: value =>
        Object.values(TRANSACTION_STATES).indexOf(value) !== -1,
    },
    modifiedAt: {
      type: Date,
      required: true,
      default: () => moment().toISOString(),
    },
    errorCode: {
      type: String,
      validate: value => Object.values(ERROR_CODES).indexOf(value) !== -1,
    },
    errorDetail: { type: String },
    version: { type: Number, required: true, default: 0 },
  },
  options,
);

transactionSchema.statics.updateWithVersionOrCreate = async function(
  key,
  update,
  options,
) {
  const modifiedAt = moment().toISOString();
  update.modifiedAt = modifiedAt;

  const existingTransaction = await this.get({
    userId: key.userId,
    transactionId: key.transactionId,
  });
  if (existingTransaction) {
    const version = existingTransaction.version + 1;
    update.version = version;
    const updatedTransaction = await this.update(
      {
        userId: key.userId,
        transactionId: key.transactionId,
        version,
      },
      {
        $PUT: update,
      },
      options,
    );
    return updatedTransaction;
  } else {
    const createdTransaction = await this.update(
      {
        userId: key.userId,
        transactionId: key.transactionId,
      },
      {
        $PUT: update,
      },
      options,
    );
    return createdTransaction;
  }
};

transactionSchema.statics.getAll = async function() {
  let results = await this.scan().exec();
  while (results.lastKey) {
    results = await this.scan()
      .startKey(results.startKey)
      .exec();
  }
  return results;
};

const Transaction = dynamoose.model('transactions', transactionSchema);

module.exports = {
  ORDER_PROCESSES,
  TRANSACTION_STATES,
  Transaction,
};
