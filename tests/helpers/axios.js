const axios = require('axios');
const keys = require('./keys').get(process.env.NODE_ENV);

const BASE_URL = keys.endpointURL;
const API_KEY = keys.endpointApiKey;

axios.defaults.baseURL = BASE_URL;
axios.defaults.headers.common['x-api-key'] = API_KEY;

module.exports = axios;
