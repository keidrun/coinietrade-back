const { Policy } = require('../../../models');
const { apiResponse } = require('../../../utils');
const { response, responseError, responseErrorFromDynamodb } = apiResponse;
const { apiMessages, apiErrors } = require('../../../messages');

const removePolicy = async (event, callback) => {
  const { userId } = event.pathParameters;

  try {
    const existingPolicy = await Policy.get(userId);
    if (existingPolicy) {
      await Policy.deleteWithVersion({ userId });
      callback(null, response(204));
    } else {
      callback(
        null,
        responseError(
          404,
          apiMessages.errors.POLICY_API_MESSAGE_DELETE_FAILED,
          event.httpMethod,
          event.path,
          apiErrors.errors.POLICY_DELETE_DATA_NOT_FOUND_BY_USER_ID,
          event,
        ),
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.POLICY_API_MESSAGE_DELETE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event,
      ),
    );
  }
};

module.exports = removePolicy;
