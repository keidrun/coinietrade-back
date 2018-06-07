const ERROR_CODES = {
  // FAILED
  UNKNOWN_ERROR: 'unknown_error',
  RELEASED_LOCKED_TRANSACTIONS: 'released_locked_transactions',
  NETWORK_ERROR: 'network_error',
  API_FAILURE: 'api_failure',
  API_UNAUTHORIZED: 'api_unauthorized',
  API_TEMPORARILY_UNAVAILABLE: 'api_temporarily_unavailable',
  // CANCELED
  ORDERS_FAILURE: 'orders_failure',
  BOTH_ORDERS_TIMEOUT: 'both_orders_timeout',
  BUY_ORDER_TIMEOUT: 'buy_order_timeout',
  SELL_ORDER_TIMEOUT: 'sell_order_timeout'
};

const errors = {
  networkError: (provider, message) => {
    return {
      code: ERROR_CODES.NETWORK_ERROR,
      provider,
      statusCode: null,
      message
    };
  },
  apiFailure: (provider, statusCode, message) => {
    return {
      code: ERROR_CODES.API_FAILURE,
      provider,
      statusCode,
      message
    };
  },
  apiUnauthorized: (provider, statusCode, message) => {
    return {
      code: ERROR_CODES.API_UNAUTHORIZED,
      provider,
      statusCode,
      message
    };
  },
  apiTemporarilyUnavailable: (provider, statusCode, message) => {
    return {
      code: ERROR_CODES.API_TEMPORARILY_UNAVAILABLE,
      provider,
      statusCode,
      message
    };
  }
};

module.exports = {
  ERROR_CODES,
  errors
};
