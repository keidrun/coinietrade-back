const axios = require('axios');

const BASE_URL = 'https://api.zaif.jp';
const TICKER_PATH = '/api/1/ticker';

const getTicker = () => {
  const URL = `${BASE_URL}${TICKER_PATH}`;
  return axios.get(`${URL}/btc_jpy`);
};

const getTickerKeys = () => {
  return {
    BID_KEY: 'bid',
    ASK_KEY: 'ask',
    LAST_KEY: 'last'
  };
};

module.exports = {
  getTicker,
  getTickerKeys
};
