/**
 * Error codes
 * format = { code, message, payload }
 */
exports.errors = {
  // 5000 Unknown Error
  UNKNOWN_ERROR: { code: 5000, message: 'Unknown error' },

  // 6xxx Database Error
  AWS_UNKNOWN_ERROR: { code: 6000, message: 'Unknown error from AWS' },
  AWS_INTERNAL_SERVER_ERROR: {
    code: 6001,
    message: 'Internal server error from AWS',
  },
  AWS_SERVICE_UNAVAILABLE: {
    code: 6002,
    message: 'Service unavailable from AWS',
  },
  DYNAMODB_DUPLICATE_DATE_ERROR: {
    code: 6003,
    message: "Data with the provided 'id' already exist",
  },
  DYNAMODB_VALIDATION_ERROR: { code: 6004, message: 'Any field is invalid' },

  // 7xxx Validation Error
  // Dynamoose errors
  DYNAMOOSE_ERROR: {
    code: 7001,
    message: 'Dynamoose error', // overwrite by dynamoose specific error message
  },
  DYNAMOOSE_MODEL_VALIDATION_ERROR: {
    code: 7002,
    message: 'Model format is invalid', // overwrite by dynamoose specific error
    // message
  },
  // Policy model errors
  POLICY_MISSING_USER_ID: {
    code: 7101,
    message: "Required field Policy 'userId' is missing",
  },
  POLICY_READ_DATA_NOT_FOUND_BY_ID: {
    code: 7102,
    message: "Policy data with the provided 'id' NOT found",
  },
  POLICY_DELETE_DATA_NOT_FOUND_BY_USER_ID: {
    code: 7103,
    message: "Policy data with the provided 'userId' NOT found",
  },
  POLICY_UPDATE_DATA_NOT_FOUND_BY_ID: {
    code: 7104,
    message: "Policy data with the provided 'id' NOT found",
  },
  POLICY_INVALID_EXPIRED_AT: {
    code: 7105,
    message: "Required field Policy 'expiredAt' is invalid",
  },
  // Secret model errors
  SECRET_MISSING_USER_ID: {
    code: 7201,
    message: "Required field Secret 'userId' is missing",
  },
  SECRET_MISSING_API_PROVIDER: {
    code: 7202,
    message: "Required field Secret 'apiProvider' is missing",
  },
  SECRET_MISSING_API_KEY: {
    code: 7203,
    message: "Required field Secret 'apiKey' is missing",
  },
  SECRET_MISSING_API_SECRET: {
    code: 7204,
    message: "Required field Secret 'apiSecret' is missing",
  },
  SECRET_DELETE_DATA_NOT_FOUND_BY_IDS: {
    code: 7205,
    message: "Secret data with the provided 'userId' and 'secretId' NOT found",
  },
  // Rule model errors
  RULE_MISSING_USER_ID: {
    code: 7301,
    message: "Required field Rule 'userId' is missing",
  },
  RULE_MISSING_ARBITRAGE_STRATEGY: {
    code: 7302,
    message: "Required field Rule 'arbitrageStrategy' is missing",
  },
  RULE_MISSING_COIN_UNIT: {
    code: 7303,
    message: "Required field Rule 'coinUnit' is missing",
  },
  RULE_MISSING_CURRENCY_UNIT: {
    code: 7304,
    message: "Required field Rule 'currencyUnit' is missing",
  },
  RULE_MISSING_ONE_SITE_NAME: {
    code: 7305,
    message: "Required field Rule 'oneSiteName' is missing",
  },
  RULE_MISSING_OTHER_SITE_NAME: {
    code: 7306,
    message: "Required field Rule 'otherSiteName' is missing",
  },
  RULE_MISSING_EXECUTION_COUNT: {
    code: 7307,
    message: "Required field Rule 'executionCount' is missing",
  },
  RULE_MISSING_SUCCESS_COUNT: {
    code: 7308,
    message: "Required field Rule 'successCount' is missing",
  },
  RULE_MISSING_FAILURE_COUNT: {
    code: 7309,
    message: "Required field Rule 'failureCount' is missing",
  },
  RULE_MISSING_CANCELLATION_COUNT: {
    code: 7310,
    message: "Required field Rule 'cancellationCount' is missing",
  },
  RULE_DELETE_DATA_NOT_FOUND_BY_IDS: {
    code: 7311,
    message: "Rule data with the provided 'userId' and 'ruleId' NOT found",
  },
  RULE_READ_DATA_NOT_FOUND_BY_USER_ID: {
    code: 7312,
    message: "Rule data with the provided 'userId' NOT found",
  },
  RULE_UPDATE_DATA_NOT_FOUND_BY_IDS: {
    code: 7313,
    message: "Rule data with the provided 'userId' and 'ruleId' NOT found",
  },
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
    payload,
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
  UNRECOGNIZED_CLIENT: 'UnrecognizedClientException',
  // statusCode 500 or 503, both can retry
};
