const apiErrors = require('../messages/apiErrors');

const response = (statusCode, body) => {
  return !body
    ? { statusCode }
    : {
        statusCode,
        body: JSON.stringify(body),
      };
};

const responseError = (
  statusCode,
  message,
  method,
  endpoint,
  validationError,
  payload,
) => {
  const errors = [validationError];
  if (!payload) payload = {};

  return {
    statusCode,
    body: JSON.stringify(
      apiErrors.createBody(message, method, endpoint, errors, payload),
    ),
  };
};

const responseErrorFromDynamodb = (
  message,
  method,
  endpoint,
  dbError,
  payload,
) => {
  let statusCode = 400;
  let errors = [];
  if (!payload) payload = {};

  if (dbError.statusCode === 400) {
    if (dbError.code === apiErrors.dynamodbKinds.CONDITIONAL_CHECK_FAILED) {
      statusCode = 409;
      let errorDynamodbDuplicateData =
        apiErrors.errors.DYNAMODB_DUPLICATE_DATE_ERROR;
      errorDynamodbDuplicateData.payload = dbError;
      errors.push(errorDynamodbDuplicateData);
    } else if (dbError.code === apiErrors.dynamodbKinds.VALIDATION) {
      let errorDynamodbValidation = apiErrors.errors.DYNAMODB_VALIDATION_ERROR;
      errorDynamodbValidation.payload = dbError;
      errors.push(errorDynamodbValidation);
    } else {
      let errorAwsUnknown = apiErrors.errors.AWS_UNKNOWN_ERROR;
      errorAwsUnknown.payload = dbError;
      errors.push(errorAwsUnknown);
    }
  } else if (dbError.statusCode === 500) {
    statusCode = 500;
    let errorAwsInternalServer = apiErrors.errors.AWS_INTERNAL_SERVER_ERROR;
    errorAwsInternalServer.payload = dbError;
    errors.push(errorAwsInternalServer);
  } else if (dbError.statusCode === 503) {
    statusCode = 500;
    let errprAwsServiceUnavailable = apiErrors.errors.AWS_SERVICE_UNAVAILABLE;
    errprAwsServiceUnavailable.payload = dbError;
    errors.push(errprAwsServiceUnavailable);
  } else {
    if (!dbError.name) {
      statusCode = 500;
      let errorUnknown = apiErrors.errors.UNKNOWN_ERROR;
      errorUnknown.payload = dbError;
      errors.push(errorUnknown);
      // Dynamoose Errors
    } else if (dbError.name === 'ValidationError') {
      let errorDynamooseModelValidation =
        apiErrors.errors.DYNAMOOSE_MODEL_VALIDATION_ERROR;
      errorDynamooseModelValidation.message = dbError.message;
      errorDynamooseModelValidation.payload = dbError;
      errors.push(errorDynamooseModelValidation);
    } else {
      // SchemaError, ModelError, QueryError, ScanError
      let errorDynamoose = apiErrors.errors.DYNAMOOSE_ERROR;
      errorDynamoose.message = dbError.message;
      errorDynamoose.payload = dbError;
      errors.push(errorDynamoose);
    }
  }
  return {
    statusCode,
    body: JSON.stringify(
      apiErrors.createBody(message, method, endpoint, errors, payload),
    ),
  };
};

module.exports = {
  response,
  responseError,
  responseErrorFromDynamodb,
};
