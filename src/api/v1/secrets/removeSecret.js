const { Secret } = require('../../../models/Secret');
const { response, responseError, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../messages/apiMessages');
const apiErrors = require('../../../messages/apiErrors');

module.exports.removeSecret = async (event, callback) => {
  const { id } = event.pathParameters;

  try {
    const existingSecret = await Secret.get(id);
    if (existingSecret) {
      await Secret.delete({ id });
      callback(null, response(204));
    } else {
      responseError(
        404,
        apiMessages.errors.SECRET_API_MESSAGE_DELETE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.SECRET_DELETE_DATA_NOT_FOUND_BY_ID,
        event
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
        event
      )
    );
  }
};
