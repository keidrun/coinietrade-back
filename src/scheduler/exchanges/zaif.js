const axios = require('axios');

const BASE_URL = 'https://api.zaif.jp';
const TICKER_PATH = '/api/1/ticker';

const getTicker = () => {
  const URL = `${BASE_URL}${TICKER_PATH}`;
  return axios.get(`${URL}/btc_jpy`);
};

const BID_KEY = 'bid';
const ASK_KEY = 'ask';
const LAST_KEY = 'last';

module.exports = {
  getTicker,
  BID_KEY,
  ASK_KEY,
  LAST_KEY
};
