/**
 * Error codes
 * format = { code, message, payload }
 */
exports.errors = {
  // 5000 Unknown Error
  UNKNOWN_ERROR: { code: 5000, message: 'Unknown error' },

  // 6xxx Database Error
  AWS_UNKNOWN_ERROR: { code: 6000, message: 'Unknown error from AWS' },
  AWS_INTERNAL_SERVER_ERROR: { code: 6001, message: 'Internal server error from AWS' },
  AWS_SERVICE_UNAVAILABLE: { code: 6002, message: 'Service unavailable from AWS' },
  DYNAMODB_DUPLICATE_DATE_ERROR: { code: 6003, message: "Data with the provided 'id' already exist" },
  DYNAMODB_VALIDATION_ERROR: { code: 6004, message: 'Any field is invalid' },

  // 7xxx Validation Error
  // Dynamoose errors
  DYNAMOOSE_ERROR: {
    code: 7001,
    message: 'Dynamoose error' // overwrite by dynamoose specific error message
  },
  DYNAMOOSE_MODEL_VALIDATION_ERROR: {
    code: 7002,
    message: 'Model format is invalid' // overwrite by dynamoose specific error
    // message
  },
  // Policy model errors
  POLICY_MISSING_USER_ID: { code: 7101, message: "Required field Policy 'userId' is missing" },
  POLICY_DUPLICATE_USER_ID: { code: 7102, message: "Required field Policy 'userId' is duplicated" },
  POLICY_READ_DATA_NOT_FOUND_BY_ID: { code: 7103, message: "Policy data with the provided 'id' NOT found" },
  POLICY_DELETE_DATA_NOT_FOUND_BY_ID: { code: 7104, message: "Policy data with the provided 'id' NOT found" },
  POLICY_UPDATE_DATA_NOT_FOUND_BY_ID: { code: 7105, message: "Policy data with the provided 'id' NOT found" },
  // Secret model errors
  SECRET_MISSING_USER_ID: { code: 7201, message: "Required field Secret 'userId' is missing" },
  SECRET_DUPLICATE_USER_ID: { code: 7202, message: "Required field Secret 'userId' is duplicated" },
  SECRET_MISSING_API_PROVIDER: { code: 7203, message: "Required field Secret 'apiProvider' is missing" },
  SECRET_MISSING_API_KEY: { code: 7204, message: "Required field Secret 'apiKey' is missing" },
  SECRET_MISSING_API_SECRET: { code: 7205, message: "Required field Secret 'apiSecret' is missing" },
  SECRET_DELETE_DATA_NOT_FOUND_BY_ID: { code: 7206, message: "Secret data with the provided 'id' NOT found" },
  // Wallet model errors
  WALLET_MISSING_USER_ID: { code: 7301, message: "Required field Wallet 'userId' is missing" },
  WALLET_DUPLICATE_USER_ID: { code: 7302, message: "Required field Wallet 'userId' is duplicated" },
  WALLET_MISSING_COMPANY: { code: 7303, message: "Required field Wallet 'company' is missing" },
  WALLET_MISSING_ADDRESS_TYPE: { code: 7304, message: "Required field Wallet 'addressType' is missing" },
  WALLET_MISSING_ADDRESS: { code: 7305, message: "Required field Wallet 'address' is missing" },
  WALLET_DELETE_DATA_NOT_FOUND_BY_ID: { code: 7306, message: "Wallet data with the provided 'id' NOT found" },
  // Rule model errors
  RULE_MISSING_USER_ID: { code: 7401, message: "Required field Rule 'userId' is missing" },
  RULE_DUPLICATE_USER_ID: { code: 7402, message: "Required field Rule 'userId' is duplicated" },
  RULE_MISSING_ARBITRAGE_STRATEGY: {
    code: 7403,
    message: "Required field Rule 'arbitrageStrategy' is missing"
  },
  RULE_MISSING_COIN_UNIT: { code: 7404, message: "Required field Rule 'coinUnit' is missing" },
  RULE_MISSING_CURRENCY_UNIT: { code: 7405, message: "Required field Rule 'currencyUnit' is missing" },
  RULE_MISSING_ORDER_AMOUNT: { code: 7406, message: "Required field Rule 'orderAmount' is missing" },
  RULE_MISSING_ORDER_PRICE: { code: 7407, message: "Required field Rule 'orderPrice' is missing" },
  RULE_MISSING_PRICE_DIFFERENCE: {
    code: 7408,
    message: "Required field Rule 'priceDifference' is missing"
  },
  RULE_MISSING_SITES: { code: 7409, message: "Required field Rule 'sites' is missing" },
  RULE_INVALID_SITES: { code: 7410, message: "Required field Rule 'sites' is invalid" },
  RULE_MISSING_SITE_NAME: { code: 7411, message: "Required field Rule 'sites[].name' is missing" },
  RULE_MISSING_SITE_EXPECTED_TRANSACTION_FEE_RATE: {
    code: 7412,
    message: "Required field Rule 'sites[].expectedTransactionFeeRate' is missing"
  },
  RULE_MISSING_SITE_EXPECTED_REMITTANCE_FEE: {
    code: 7413,
    message: "Required field Rule 'sites[].expectedRemittanceFee' is missing"
  },
  RULE_INVALID_EXPIRED_AT: { code: 7414, message: "Required field Rule 'expiredAt' is invalid" },
  RULE_DELETE_DATA_NOT_FOUND_BY_ID: { code: 7105, message: "Rule data with the provided 'id' NOT found" }
};

/**
 * Create the error response body
 * format = { message, time, method, endpoint, errors, payload }
 * @param {string} message error message
 * @param {string} method http method
 * @param {string} endpoint endpoint url
 * @param {Array<Object>} errors specific error list
 * @param {Object} payload optional infomation for developers
 * @return {Object} error response body
 */
exports.createBody = function(message, method, endpoint, errors, payload) {
  return {
    message,
    time: new Date(),
    method,
    endpoint,
    errors,
    payload
  };
};

/**
 * DynamoDB error codes
 */
exports.dynamodbKinds = {
  // statusCode 400
  // cannot retry
  VALIDATION: 'ValidationException',
  ACCESS_DENIED: 'AccessDeniedException',
  CONDITIONAL_CHECK_FAILED: 'ConditionalCheckFailedException',
  INCOMPLETE_SIGNATURE: 'IncompleteSignatureException',
  MISSING_AUTHENTICATION_TOKEN: 'MissingAuthenticationTokenException',
  RESOURCE_IN_USE: 'ResourceInUseException',
  RESOURCE_NOT_FOUND: 'ResourceNotFoundException',
  // can retry
  ITEM_COLLECTION_SIZE_LIMIT: 'ItemCollectionSizeLimitExceededException',
  LIMIT_EXCEEDED: 'LimitExceededException',
  PROVISIONED_THROUGHPUT_EXCEEDED: 'ProvisionedThroughputExceededException',
  THROTTLING: 'ThrottlingException',
  UNRECOGNIZED_CLIENT: 'UnrecognizedClientException'
  // statusCode 500 or 503, both can retry
};
