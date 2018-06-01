const axios = require('axios');
const crypto = require('crypto');
const { COIN_UNITS, CURRENCY_UNITS, ORDER_TYPES } = require('../../models/Rule');
const { ORDER_PROCESSES } = require('../../models/Transaction');

const DEFAULT_TRANSACTION_MIN_AMOUNT = 0.001;

const BASE_URL = 'https://api.bitflyer.jp';
// Public
const BOARD_PATH = '/v1/board';
// Private
const TRANSACTION_FEE_PATH = '/v1/me/gettradingcommission';
const ASSETS_PATH = '/v1/me/getbalance';
const ORDER_PATH = '/v1/me/sendchildorder';
const COMPLETED_OERDER_PATH = '/v1/me/getexecutions';
const CANCEL_OERDER_PATH = '/v1/me/cancelchildorder';

function getPairCode(coinUnit, currencyUnit) {
  if (coinUnit === 'btc' && currencyUnit === 'jpy') {
    return 'BTC_JPY';
  } else {
    // default
    return 'BTC_JPY';
  }
}

function generateAccessHeaders(key, secret, method, path, body) {
  const timestamp = Date.now().toString();
  const bodyStr = body ? JSON.stringify(body) : '';
  const text = timestamp + method + path + bodyStr;
  const sign = crypto.createHmac('sha256', secret).update(text).digest('hex');

  return {
    'ACCESS-KEY': key,
    'ACCESS-TIMESTAMP': timestamp,
    'ACCESS-SIGN': sign
  };
}

function getAssetCoinCode(coinUnit) {
  if (coinUnit === COIN_UNITS.BTC) {
    return 'BTC';
  } else {
    return 'BTC';
  }
}

function getAssetCurrencyCode(currencyUnit) {
  if (currencyUnit === CURRENCY_UNITS.JPY) {
    return 'JPY';
  } else {
    return 'JPY';
  }
}

class Bitflyer {
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
    const PATH = `${TRANSACTION_FEE_PATH}?product_code=${this.pairCode}`;
    const URL = `${BASE_URL}${PATH}`;
    const method = 'GET';
    const headers = generateAccessHeaders(this.apiKey, this.apiSecret, method, PATH);
    const response = await axios.get(`${URL}`, { headers });

    const transactionFee = response.data.commission_rate;

    return transactionFee;
  }

  async getAssets() {
    const PATH = ASSETS_PATH;
    const URL = `${BASE_URL}${PATH}`;
    const method = 'GET';
    const headers = generateAccessHeaders(this.apiKey, this.apiSecret, method, PATH);
    const response = await axios.get(`${URL}`, { headers });

    const presentCoinAmount = response.data.filter((data) => data.currency_code === getAssetCoinCode(this.coinUnit))[0]
      .available;
    const presentCurrencyAmount = response.data.filter(
      (data) => data.currency_code === getAssetCurrencyCode(this.currencyUnit)
    )[0].available;

    return {
      presentCoinAmount,
      presentCurrencyAmount
    };
  }

  async order(process, type, price, amount) {
    let side;
    if (process === ORDER_PROCESSES.BUY) {
      side = 'BUY';
    } else {
      side = 'SELL';
    }
    let childOrderType;
    if (type === ORDER_TYPES.MARKET_ORDER) {
      childOrderType = 'MARKET';
    } else {
      childOrderType = 'LIMIT';
    }
    const PATH = `${ORDER_PATH}`;
    const URL = `${BASE_URL}${PATH}`;
    const method = 'POST';
    const body = {
      product_code: this.pairCode,
      child_order_type: childOrderType,
      side,
      price,
      size: amount,
      minute_to_expire: 43200, // 30 days (default)
      time_in_force: 'GTC' // Good 'Til Canceled (default)
    };
    const headers = generateAccessHeaders(this.apiKey, this.apiSecret, method, PATH, body);
    const response = await axios.post(`${URL}`, body, { headers });
    const orderId = response.data.child_order_acceptance_id;

    return orderId;
  }

  async isCompletedOrder(orderId) {
    const PATH = `${COMPLETED_OERDER_PATH}?product_code=${this
      .pairCode}&count=100&child_order_acceptance_id=${orderId}`;
    const URL = `${BASE_URL}${PATH}`;
    const method = 'GET';
    const headers = generateAccessHeaders(this.apiKey, this.apiSecret, method, PATH);
    const response = await axios.get(`${URL}`, { headers });
    const completedOrders = response.data;

    if (completedOrders.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  async cancelOrder(orderId) {
    const PATH = `${CANCEL_OERDER_PATH}`;
    const URL = `${BASE_URL}${PATH}`;
    const method = 'POST';
    const body = {
      product_code: this.pairCode,
      child_order_acceptance_id: orderId
    };
    const headers = generateAccessHeaders(this.apiKey, this.apiSecret, method, PATH, body);
    await axios.post(`${URL}`, body, { headers });

    return orderId;
  }

  async getSortedBoard() {
    const PATH = `${BOARD_PATH}?product_code=${this.pairCode}`;
    const URL = `${BASE_URL}${PATH}`;
    const response = await axios.get(`${URL}`);
    const bids = response.data.bids;
    bids.sort((a, b) => {
      if (a.price > b.price) return -1;
      if (a.price < b.price) return 1;
      return 0;
    });
    const asks = response.data.asks;
    asks.sort((a, b) => {
      if (a.price < b.price) return -1;
      if (a.price > b.price) return 1;
      return 0;
    });
    const formattedBids = bids.map((bid) => {
      return {
        price: bid.price,
        amount: bid.size
      };
    });
    const formattedAsks = asks.map((ask) => {
      return {
        price: ask.price,
        amount: ask.size
      };
    });
    return {
      bids: formattedBids,
      asks: formattedAsks
    };
  }
}

module.exports = Bitflyer;