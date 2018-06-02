const ERROR_CODES = {
  REQUEST_FAILURE: 'request_failure',
  REQUEST_TEMPORARILY_UNAVAILABLE: 'request_temporarily_unavailable'
};

const errors = {
  requestFailure: (status, message) => {
    return {
      code: ERROR_CODES.REQUEST_FAILURE,
      status,
      message
    };
  },
  requestTemporarilyUnavailable: (status, message) => {
    return {
      code: ERROR_CODES.REQUEST_TEMPORARILY_UNAVAILABLE,
      status,
      message
    };
  }
};

module.exports = {
  ERROR_CODES,
  errors
};
