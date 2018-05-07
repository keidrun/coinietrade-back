const axios = require('axios');

const BASE_URL = 'https://api.bitflyer.jp';
const TICKER_PATH = '/v1/ticker';

const getTicker = () => {
  const URL = `${BASE_URL}${TICKER_PATH}`;
  return axios.get(`${URL}?product_code=BTC_JPY`);
};

const getTickerKeys = () => {
  return {
    BID_KEY: 'best_bid',
    ASK_KEY: 'best_ask',
    LAST_KEY: 'ltp'
  };
};

module.exports = {
  getTicker,
  getTickerKeys
};
