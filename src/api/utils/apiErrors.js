/**
 * Error codes
 * format = { code, message, payload }
 */
exports.errors = {
  // 5000 Unknown Error
  UNKNOWN_ERROR: {
    code: 5000,
    message: 'Unknown error'
  },

  // 6xxx Database Error
  AWS_UNKNOWN_ERROR: {
    code: 6000,
    message: 'Unknown error from AWS'
  },
  AWS_INTERNAL_SERVER_ERROR: {
    code: 6001,
    message: 'Internal server error from AWS'
  },
  AWS_SERVICE_UNAVAILABLE: {
    code: 6002,
    message: 'Service unavailable from AWS'
  },
  DYNAMODB_DUPLICATE_DATE_ERROR: {
    code: 6003,
    message: "Data with the provided 'id' already exist"
  },
  DYNAMODB_VALIDATION_ERROR: {
    code: 6004,
    message: 'Any field is invalid'
  },

  // 7xxx Validation Error
  // Dynamoose errors
  DYNAMOOSE_ERROR: {
    code: 7001,
    message: 'Dynamoose error' // overwrite by dynamoose specific error message
  },
  DYNAMOOSE_MODEL_VALIDATION_ERROR: {
    code: 7002,
    message: 'Model format is invalid' // overwrite by dynamoose specific error message
  },
  // Policy model errors
  POLICY_MISSING_USER_ID: {
    code: 7101,
    message: "Required field policy 'userId' is missing"
  },
  POLICY_DUPLICATE_USER_ID: {
    code: 7102,
    message: "Required field policy 'userId' is duplicated"
  },

  // 8xxx Specific Api Error
  // Policies api errors
  POLICY_READ_DATA_NOT_FOUND_BY_ID: {
    code: 8101,
    message: "Policy data with the provided 'id' NOT found"
  }
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