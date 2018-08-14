const { Secret } = require('../../../models');
const { apiResponse } = require('../../../utils');
const { response, responseError, responseErrorFromDynamodb } = apiResponse;
const { apiMessages, apiErrors } = require('../../../messages');

const removeSecret = async (event, callback) => {
  const { userId, secretId } = event.pathParameters;

  try {
    const existingSecret = await Secret.get({ userId, secretId });
    if (existingSecret) {
      await Secret.deleteWithVersion({ userId, secretId });
      callback(null, response(204));
    } else {
      callback(
        null,
        responseError(
          404,
          apiMessages.errors.SECRET_API_MESSAGE_DELETE_FAILED,
          event.httpMethod,
          event.path,
          apiErrors.errors.SECRET_DELETE_DATA_NOT_FOUND_BY_IDS,
          event,
        ),
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.SECRET_API_MESSAGE_DELETE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event,
      ),
    );
  }
};

module.exports = removeSecret;
