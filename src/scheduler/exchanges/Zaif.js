const moment = require('moment');
const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');
const { COIN_UNITS, CURRENCY_UNITS, ORDER_TYPES } = require('../../models/Rule');
const { ORDER_PROCESSES } = require('../../models/Transaction');
const { errors } = require('./errors');
const messages = {
  NO_DATA_FOUND_FOR_THE_KEY: 'no data found for the key',
  SIGNATURE_MISMATCH: 'signature mismatch',
  TRADE_TEMPORARILY_UNAVAILABLE: 'trade temporarily unavailable.'
};

const DEFAULT_TRANSACTION_FEE_RATE = 0;
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

function generateEncodedParams(params) {
  const nonce = moment.utc().format('x') / 1000;
  params.nonce = nonce;
  const encodedParams = qs.stringify(params);
  return encodedParams;
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
    const params = {
      method: ASSETS_METHOD
    };
    const encodedParams = generateEncodedParams(params);
    const headers = generateAccessHeaders(this.apiKey, this.apiSecret, encodedParams);
    try {
      const response = await axios.post(`${PRIVATE_URL}`, encodedParams, { headers });

      if (response.data.success !== 1) {
        if (
          response.data.error.indexOf(messages.NO_DATA_FOUND_FOR_THE_KEY) != -1 &&
          response.data.error.indexOf(messages.SIGNATURE_MISMATCH) != -1
        ) {
          return Promise.reject(
            errors.apiUnauthorized(
              response.status,
              `Failed to post '${PRIVATE_URL}' with '${ASSETS_METHOD}': ${response.data.error}`
            )
          );
        } else if (response.data.error.indexOf(messages.TRADE_TEMPORARILY_UNAVAILABLE) != -1) {
          return Promise.reject(
            errors.apiTemporarilyUnavailable(
              response.status,
              `Failed to post '${PRIVATE_URL}' with '${ASSETS_METHOD}': ${response.data.error}`
            )
          );
        } else {
          return Promise.reject(
            errors.apiFailure(
              response.status,
              `Failed to post '${PRIVATE_URL}' with '${ASSETS_METHOD}': ${response.data.error}`
            )
          );
        }
      }

      const presentCoinAmount = response.data.return.funds[getAssetCoinCode(this.coinUnit)];
      const presentCurrencyAmount = response.data.return.funds[getAssetCurrencyCode(this.currencyUnit)];

      return {
        presentCoinAmount,
        presentCurrencyAmount
      };
    } catch (error) {
      if (!error.response) {
        return Promise.reject(errors.networkError(error.toString()));
      } else {
        return Promise.reject(errors.apiFailure(error.response.status, JSON.stringify(error.response.data)));
      }
    }
  }

  async order(process, type, price, amount) {
    if (type !== ORDER_TYPES.LIMIT_ORDER) {
      return Promise.reject(`Cannot apply the order type: ${type}`);
    }
    let params;
    if (process === ORDER_PROCESSES.BUY) {
      params = {
        method: ORDER_METHOD,
        currency_pair: this.pairCode,
        action: 'bid',
        price,
        amount
      };
    } else {
      params = {
        method: ORDER_METHOD,
        currency_pair: this.pairCode,
        action: 'ask',
        price,
        amount
      };
    }
    const encodedParams = generateEncodedParams(params);
    const headers = generateAccessHeaders(this.apiKey, this.apiSecret, encodedParams);

    try {
      const response = await axios.post(`${PRIVATE_URL}`, encodedParams, { headers });
      if (response.data.success !== 1) {
        if (
          response.data.error.indexOf(messages.NO_DATA_FOUND_FOR_THE_KEY) != -1 &&
          response.data.error.indexOf(messages.SIGNATURE_MISMATCH) != -1
        ) {
          return Promise.reject(
            errors.apiUnauthorized(
              response.status,
              `Failed to post '${PRIVATE_URL}' with '${ORDER_METHOD}': ${response.data.error}`
            )
          );
        } else if (response.data.error.indexOf(messages.TRADE_TEMPORARILY_UNAVAILABLE) != -1) {
          return Promise.reject(
            errors.apiTemporarilyUnavailable(
              response.status,
              `Failed to post '${PRIVATE_URL}' with '${ORDER_METHOD}': ${response.data.error}`
            )
          );
        } else {
          return Promise.reject(
            errors.apiFailure(
              response.status,
              `Failed to post '${PRIVATE_URL}' with '${ORDER_METHOD}': ${response.data.error}`
            )
          );
        }
      }

      const orderId = response.data.return.order_id;

      return orderId;
    } catch (error) {
      if (!error.response) {
        return Promise.reject(errors.networkError(error.toString()));
      } else {
        return Promise.reject(errors.apiFailure(error.response.status, JSON.stringify(error.response.data)));
      }
    }
  }

  async isCompletedOrder(orderId) {
    const params = {
      method: ACTIVE_ORDER_METHOD,
      currency_pair: this.pairCode
    };
    const encodedParams = generateEncodedParams(params);
    const headers = generateAccessHeaders(this.apiKey, this.apiSecret, encodedParams);

    try {
      const response = await axios.post(`${PRIVATE_URL}`, encodedParams, { headers });
      if (response.data.success !== 1) {
        if (
          response.data.error.indexOf(messages.NO_DATA_FOUND_FOR_THE_KEY) != -1 &&
          response.data.error.indexOf(messages.SIGNATURE_MISMATCH) != -1
        ) {
          return Promise.reject(
            errors.apiUnauthorized(
              response.status,
              `Failed to post '${PRIVATE_URL}' with '${ACTIVE_ORDER_METHOD}': ${response.data.error}`
            )
          );
        } else if (response.data.error.indexOf(messages.TRADE_TEMPORARILY_UNAVAILABLE) != -1) {
          return Promise.reject(
            errors.apiTemporarilyUnavailable(
              response.status,
              `Failed to post '${PRIVATE_URL}' with '${ACTIVE_ORDER_METHOD}': ${response.data.error}`
            )
          );
        } else {
          return Promise.reject(
            errors.apiFailure(
              response.status,
              `Failed to post '${PRIVATE_URL}' with '${ACTIVE_ORDER_METHOD}': ${response.data.error}`
            )
          );
        }
      }

      const isCompleted = response.data.return.hasOwnProperty(orderId) ? false : true;

      return isCompleted;
    } catch (error) {
      if (!error.response) {
        return Promise.reject(errors.networkError(error.toString()));
      } else {
        return Promise.reject(errors.apiFailure(error.response.status, JSON.stringify(error.response.data)));
      }
    }
  }

  async cancelOrder(orderId) {
    const params = {
      method: CANCEL_ORDER_METHOD,
      order_id: orderId,
      currency_pair: this.pairCode
    };
    const encodedParams = generateEncodedParams(params);
    const headers = generateAccessHeaders(this.apiKey, this.apiSecret, encodedParams);

    try {
      const response = await axios.post(`${PRIVATE_URL}`, encodedParams, { headers });
      if (response.data.success !== 1) {
        if (
          response.data.error.indexOf(messages.NO_DATA_FOUND_FOR_THE_KEY) != -1 &&
          response.data.error.indexOf(messages.SIGNATURE_MISMATCH) != -1
        ) {
          return Promise.reject(
            errors.apiUnauthorized(
              response.status,
              `Failed to post '${PRIVATE_URL}' with '${CANCEL_ORDER_METHOD}': ${response.data.error}`
            )
          );
        } else if (response.data.error.indexOf(messages.TRADE_TEMPORARILY_UNAVAILABLE) != -1) {
          return Promise.reject(
            errors.apiTemporarilyUnavailable(
              response.status,
              `Failed to post '${PRIVATE_URL}' with '${CANCEL_ORDER_METHOD}': ${response.data.error}`
            )
          );
        } else {
          return Promise.reject(
            errors.apiFailure(
              response.status,
              `Failed to post '${PRIVATE_URL}' with '${CANCEL_ORDER_METHOD}': ${response.data.error}`
            )
          );
        }
      }

      return Promise.resolve(orderId);
    } catch (error) {
      if (!error.response) {
        return Promise.reject(errors.networkError(error.toString()));
      } else {
        return Promise.reject(errors.apiFailure(error.response.status, JSON.stringify(error.response.data)));
      }
    }
  }

  async getSortedBoard() {
    const PATH = `${BOARD_PATH}/${this.pairCode}`;
    const URL = `${BASE_URL}${PATH}`;

    try {
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
    } catch (error) {
      if (!error.response) {
        return Promise.reject(errors.networkError(error.toString()));
      } else {
        return Promise.reject(errors.apiFailure(error.response.status, JSON.stringify(error.response.data)));
      }
    }
  }
}

module.exports = Zaif;
