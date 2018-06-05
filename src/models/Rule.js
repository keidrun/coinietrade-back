const uuid = require('uuid');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;

const DEFAULT_COMMITMENT_TIME_LIMIT_SEC = 120;

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
  UNAVAILABLE: 'unavailable',
  DELETED: 'deleted'
};

const options = {
  timestamps: true,
  useNativeBooleans: true,
  useDocumentTypes: true
};

const ruleSchema = new Schema(
  {
    userId: { type: String, hashKey: true, required: true, trim: true },
    ruleId: { type: String, rangeKey: true, default: () => uuid.v4() },
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
      default: 100,
      validate: (value) => (value >= 0 && value <= 1 ? true : false)
    },
    assetMinLimit: {
      type: Number,
      required: true,
      default: 0,
      validate: (value) => (value >= 0 ? true : false)
    },
    commitmentTimeLimit: {
      // Seconnds
      type: Number,
      required: true,
      default: DEFAULT_COMMITMENT_TIME_LIMIT_SEC,
      validate: (value) => (value >= 0 ? true : false)
    },
    buyWeightRate: {
      type: Number,
      required: true,
      default: 0,
      validate: (value) => (value > -1 && value < 1 ? true : false)
    },
    sellWeightRate: {
      type: Number,
      required: true,
      default: 0,
      validate: (value) => (value > -1 && value < 1 ? true : false)
    },
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
      index: { global: true, name: 'statusIndex', project: true },
      required: true,
      default: RULE_STATUS.AVAILABLE,
      validate: (value) => Object.values(RULE_STATUS).indexOf(value) !== -1
    },
    version: { type: Number, required: true, default: 0 }
  },
  options
);

ruleSchema.statics.updateWithVersion = async function(key, update, options) {
  const existingRule = await this.get({
    userId: key.userId,
    ruleId: key.ruleId
  });
  if (existingRule) {
    const version = existingRule.version + 1;
    update.version = version;
    const updatedRule = await this.update(
      {
        userId: key.userId,
        ruleId: key.ruleId,
        version
      },
      {
        $PUT: update
      },
      options
    );
    return updatedRule;
  } else {
    throw new Error('The Rule update failed. It was NOT found.');
  }
};

ruleSchema.statics.deleteWithVersion = async function(key, options) {
  const existingRule = await this.get({
    userId: key.userId,
    ruleId: key.ruleId
  });
  if (existingRule) {
    const version = existingRule.version + 1;
    const deletedRule = await this.delete(
      {
        userId: key.userId,
        ruleId: key.ruleId,
        version
      },
      options
    );
    return deletedRule;
  } else {
    throw new Error('The Rule delete failed. It was NOT found.');
  }
};

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
