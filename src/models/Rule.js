const uuid = require('uuid');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;

const ARBITRAGE_STRATEGIES = {
  SIMPLE: 'simple'
};

const ORDER_TYPES = {
  LIMIT_ORDER: 'limit_order',
  MARKET_ORDER: 'market_order'
};

const COIN_UNITS = {
  BTC: 'btc'
};

const CURRENCY_UNITS = {
  JPY: 'jpy',
  USD: 'usd',
  CAD: 'cad'
};

const EXCHANGE_SITES = {
  BITFLYER: 'bitflyer',
  ZAIF: 'zaif'
};

const RULE_STATUS = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable'
};

const options = {
  timestamps: true,
  useNativeBooleans: true,
  useDocumentTypes: true
};

const ruleSchema = new Schema(
  {
    id: { type: String, hashKey: true, default: () => uuid.v4() },
    userId: { type: String, required: true, trim: true },
    priority: { type: Number, required: true, default: 0 },
    arbitrageStrategy: {
      type: String,
      required: true,
      validate: (value) => Object.values(ARBITRAGE_STRATEGIES).indexOf(value) !== -1
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
    assetRange: {
      type: Number,
      required: true,
      validate: (value) => (value >= 0 ? true : false)
    },
    commitmentTimeLimit: {
      type: Number,
      required: true,
      validate: (value) => (value >= 0 ? true : false)
    },
    buyWeightRate: { type: Number, required: true, default: 0 },
    sellWeightRate: { type: Number, required: true, default: 0 },
    oneSiteName: {
      type: String,
      required: true,
      validate: (value) => Object.values(EXCHANGE_SITES).indexOf(value) !== -1
    },
    otherSiteName: {
      type: String,
      required: true,
      validate: (value) => Object.values(EXCHANGE_SITES).indexOf(value) !== -1
    },
    totalProfit: { type: Number, required: true, default: 0 },
    counts: {
      // Initialize all to 0 in api because the dynamoose cannot define
      // defaults in an object
      executionCount: { type: Number, required: true },
      successCount: { type: Number, required: true },
      failureCount: { type: Number, required: true },
      cancellationCount: { type: Number, required: true }
    },
    status: {
      type: String,
      required: true,
      default: RULE_STATUS.AVAILABLE,
      validate: (value) => Object.values(RULE_STATUS).indexOf(value) !== -1
    },
    version: { type: Number, required: true, default: 0 }
  },
  options
);

ruleSchema.statics.getAll = async function() {
  let results = await this.scan().exec();
  while (results.lastKey) {
    results = await this.scan().startKey(results.startKey).exec();
  }
  return results;
};

const Rule = dynamoose.model('rules', ruleSchema);

module.exports = {
  ARBITRAGE_STRATEGIES,
  ORDER_TYPES,
  COIN_UNITS,
  CURRENCY_UNITS,
  EXCHANGE_SITES,
  RULE_STATUS,
  Rule
};
