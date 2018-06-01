const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');
const { COIN_UNITS, CURRENCY_UNITS, ORDER_TYPES } = require('../../models/Rule');
const { ORDER_PROCESSES } = require('../../models/Transaction');

const DEFAULT_TRANSACTION_FEE_RATE = -0.01;
const DEFAULT_TRANSACTION_MIN_AMOUNT = 0.0001;

// Public
const BASE_URL = 'https://api.zaif.jp/api';
const BOARD_PATH = '/1/depth';
// Private
const PRIVATE_URL = 'https://api.zaif.jp/tapi';
const ASSETS_METHOD = 'get_info2';
const ORDER_METHOD = 'trade';
const ACTIVE_ORDER_METHOD = 'active_orders';
const CANCEL_ORDER_METHOD = 'cancel_order';

function getPairCode(coinUnit, currencyUnit) {
  if (coinUnit === 'btc' && currencyUnit === 'jpy') {
    return 'btc_jpy';
  } else {
    // default
    return 'btc_jpy';
  }
}

function generateAccessHeaders(key, secret, encodedParams) {
  const sign = crypto.createHmac('sha512', secret).update(encodedParams).digest('hex');
  return { key, sign };
}

function getAssetCoinCode(coinUnit) {
  if (coinUnit === COIN_UNITS.BTC) {
    return 'btc';
  } else {
    return 'btc';
  }
}

function getAssetCurrencyCode(currencyUnit) {
  if (currencyUnit === CURRENCY_UNITS.JPY) {
    return 'jpy';
  } else {
    return 'jpy';
  }
}

class Zaif {
  constructor(name, apiKey, apiSecret, coinUnit, currencyUnit) {
    this.name = name;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.coinUnit = coinUnit;
    this.currencyUnit = currencyUnit;
    this.pairCode = getPairCode(coinUnit, currencyUnit);
  }

  getName() {
    return this.name;
  }

  getTransactionMinAmount() {
    return DEFAULT_TRANSACTION_MIN_AMOUNT;
  }

  async getTransactionFeeRate() {
    return DEFAULT_TRANSACTION_FEE_RATE;
  }

  async getAssets() {
    const nonce = Date.now().toString() / 1000;
    const params = {
      nonce,
      method: ASSETS_METHOD
    };
    const encodedParams = qs.stringify(params);
    const headers = generateAccessHeaders(this.apiKey, this.apiSecret, encodedParams);
    const response = await axios.post(`${PRIVATE_URL}`, encodedParams, { headers });

    if (response.data.success !== 1) {
      throw new Error(`Failed to post '${PRIVATE_URL}' with '${ASSETS_METHOD}': ${response.data.error}`);
    }

    const presentCoinAmount = response.data.return.funds[getAssetCoinCode(this.coinUnit)];
    const presentCurrencyAmount = response.data.return.funds[getAssetCurrencyCode(this.currencyUnit)];

    return {
      presentCoinAmount,
      presentCurrencyAmount
    };
  }

  async order(process, type, price, amount) {
    if (type !== ORDER_TYPES.LIMIT_ORDER) {
      throw new Error(`Cannot apply the order type: ${type}`);
    }
    const nonce = Date.now().toString() / 1000;
    let params;
    if (process === ORDER_PROCESSES.BUY) {
      params = {
        nonce,
        method: ORDER_METHOD,
        currency_pair: this.pairCode,
        action: 'bid',
        price,
        amount
      };
    } else {
      params = {
        nonce,
        method: ORDER_METHOD,
        currency_pair: this.pairCode,
        action: 'ask',
        price,
        amount
      };
    }
    const encodedParams = qs.stringify(params);
    const headers = generateAccessHeaders(this.apiKey, this.apiSecret, encodedParams);
    const response = await axios.post(`${PRIVATE_URL}`, encodedParams, { headers });
    if (response.data.success !== 1) {
      throw new Error(`Failed to post '${PRIVATE_URL}' with '${ORDER_METHOD}': ${response.data.error}`);
    }

    const orderId = response.data.return.order_id;

    return orderId;
  }

  async isCompletedOrder(orderId) {
    const nonce = Date.now().toString() / 1000;
    const params = {
      nonce,
      method: ACTIVE_ORDER_METHOD,
      currency_pair: this.pairCode
    };
    const encodedParams = qs.stringify(params);
    const headers = generateAccessHeaders(this.apiKey, this.apiSecret, encodedParams);
    const response = await axios.post(`${PRIVATE_URL}`, encodedParams, { headers });
    if (response.data.success !== 1) {
      throw new Error(`Failed to post '${PRIVATE_URL}' with '${ACTIVE_ORDER_METHOD}: ${response.data.error}'`);
    }

    return response.data.return.hasOwnProperty(orderId) ? false : true;
  }

  async cancelOrder(orderId) {
    const nonce = Date.now().toString() / 1000;
    const params = {
      nonce,
      method: CANCEL_ORDER_METHOD,
      order_id: orderId,
      currency_pair: this.pairCode
    };
    const encodedParams = qs.stringify(params);
    const headers = generateAccessHeaders(this.apiKey, this.apiSecret, encodedParams);
    const response = await axios.post(`${PRIVATE_URL}`, encodedParams, { headers });
    if (response.data.success !== 1) {
      throw new Error(`Failed to post '${PRIVATE_URL}' with '${CANCEL_ORDER_METHOD}': ${response.data.error}`);
    }

    return orderId;
  }

  async getSortedBoard() {
    const PATH = `${BOARD_PATH}/${this.pairCode}`;
    const URL = `${BASE_URL}${PATH}`;
    const response = await axios.get(`${URL}`);

    const bids = response.data.bids;
    bids.sort((a, b) => {
      if (a > b) return -1;
      if (a < b) return 1;
      return 0;
    });
    const asks = response.data.asks;
    asks.sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
    const formattedBids = bids.map((bid) => {
      return {
        price: bid[0],
        amount: bid[1]
      };
    });
    const formattedAsks = asks.map((ask) => {
      return {
        price: ask[0],
        amount: ask[1]
      };
    });
    return {
      bids: formattedBids,
      asks: formattedAsks
    };
  }
}

module.exports = Zaif;
