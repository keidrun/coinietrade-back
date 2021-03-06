const { Policy } = require('../../../models');
const { apiResponse } = require('../../../utils');
const { response, responseError, responseErrorFromDynamodb } = apiResponse;
const { apiMessages, apiErrors } = require('../../../messages');

const getPolicy = async (event, callback) => {
  const { userId } = event.pathParameters;

  try {
    const policy = await Policy.get(userId);
    if (policy) {
      callback(null, response(200, policy));
    } else {
      callback(
        null,
        responseError(
          404,
          apiMessages.errors.POLICY_API_MESSAGE_READ_FAILED,
          event.httpMethod,
          event.path,
          apiErrors.errors.POLICY_READ_DATA_NOT_FOUND_BY_ID,
          event,
        ),
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.POLICY_API_MESSAGE_READ_FAILED,
        event.httpMethod,
        event.path,
        error,
        event,
      ),
    );
  }
};

module.exports = getPolicy;
