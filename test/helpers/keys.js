require('dotenv').config();

const config = {
  production: {
    endpointURL: process.env.PROD_ENDPOINT_URL,
    endpointApiKey: process.env.PROD_ENDPOINT_API_KEY
  },
  staging: {
    endpointURL: process.env.STAGING_ENDPOINT_URL,
    endpointApiKey: process.env.STAGING_ENDPOINT_API_KEY
  },
  default: {
    endpointURL: process.env.DEV_ENDPOINT_URL,
    endpointApiKey: process.env.DEV_ENDPOINT_API_KEY
  }
};

module.exports.get = function get(env) {
  return config[env] || config.default;
};
