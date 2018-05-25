const uuid = require('uuid');
const moment = require('moment');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;

const ARBITRAGE_STRATEGIES = {
  SIMPLE: 'simple'
};
const arbitrageStrategyList = Object.values(ARBITRAGE_STRATEGIES);

const ORDER_TYPES = {
  LIMIT_ORDER: 'limit_order',
  MARKET_ORDER: 'market_order'
};
const orderTypeList = Object.values(ORDER_TYPES);

const COIN_UNITS = {
  BTC: 'btc'
};
const coinList = Object.values(COIN_UNITS);

const exchangeSiteList = [ 'bitflyer', 'zaif' ];

const CURRENCY_UNITS = {
  JPY: 'jpy',
  USD: 'usd',
  CAD: 'cad'
};
const moneyUnitList = Object.values(CURRENCY_UNITS);

const options = {
  timestamps: true,
  useNativeBooleans: true,
  useDocumentTypes: true
};

const ruleSchema = new Schema(
  {
    id: { type: String, hashKey: true, default: () => uuid.v4() },
    userId: { type: String, required: true, trim: true },
    arbitrageStrategy: {
      type: String,
      required: true,
      default: ARBITRAGE_STRATEGIES.SIMPLE,
      validate: (value) => arbitrageStrategyList.indexOf(value) !== -1
    },
    orderType: {
      type: String,
      required: true,
      default: ORDER_TYPES.LIMIT_ORDER,
      validate: (value) => orderTypeList.indexOf(value) !== -1
    },
    coinUnit: {
      type: String,
      required: true,
      default: COIN_UNITS.BTC,
      validate: (value) => coinList.indexOf(value) !== -1
    },
    currencyUnit: {
      type: String,
      required: true,
      default: CURRENCY_UNITS.JPY,
      validate: (value) => moneyUnitList.indexOf(value) !== -1
    },
    orderAmount: {
      type: Number,
      required: true,
      default: 0,
      validate: (value) => (value > 0 ? true : false)
    },
    orderPrice: {
      type: Number,
      required: true,
      default: 0,
      validate: (value) => (value > 0 ? true : false)
    },
    orderPriority: { type: Number, required: true, default: 0 },
    priceDifference: {
      type: Number,
      required: true,
      default: 0,
      validate: (value) => (value > 0 ? true : false)
    },
    a: {
      exchangeSiteName: {
        type: String,
        required: true,
        trim: true,
        validate: (value) => exchangeSiteList.indexOf(value) !== -1
      },
      expectedTransactionFeeRate: { type: Number, required: true },
      expectedRemittanceFee: { type: Number, required: true }
    },
    b: {
      exchangeSiteName: {
        type: String,
        required: true,
        trim: true,
        validate: (value) => exchangeSiteList.indexOf(value) !== -1
      },
      expectedTransactionFeeRate: { type: Number, required: true },
      expectedRemittanceFee: { type: Number, required: true }
    },
    counts: {
      executionCount: { type: Number, required: true, default: 0 },
      successCount: { type: Number, required: true, default: 0 },
      failureCount: { type: Number, required: true, default: 0 },
      retryCount: { type: Number, required: true, default: 0 }
    },
    expiredAt: {
      type: Number,
      required: true,
      default: () => moment().add(1, 'month').format('x') // Unix timestamp of 13 digits format
    }
  },
  options
);

const Rule = dynamoose.model('rules', ruleSchema);

module.exports = {
  ARBITRAGE_STRATEGIES,
  ORDER_TYPES,
  COIN_UNITS,
  CURRENCY_UNITS,
  Rule
};
