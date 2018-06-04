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
  networkError: (message) => {
    return {
      code: ERROR_CODES.NETWORK_ERROR,
      status: null,
      message
    };
  },
  apiFailure: (status, message) => {
    return {
      code: ERROR_CODES.API_FAILURE,
      status,
      message
    };
  },
  apiUnauthorized: (status, message) => {
    return {
      code: ERROR_CODES.API_UNAUTHORIZED,
      status,
      message
    };
  },
  apiTemporarilyUnavailable: (status, message) => {
    return {
      code: ERROR_CODES.API_TEMPORARILY_UNAVAILABLE,
      status,
      message
    };
  }
};

module.exports = {
  ERROR_CODES,
  errors
};
