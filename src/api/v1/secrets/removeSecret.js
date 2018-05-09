const { Secret } = require('../../../models/Secret');
const {
  response,
  responseErrorFromDynamodb
} = require('../../../utils/response');
const apiMessages = require('../../../utils/apiMessages');

module.exports.removeSecret = async (event, callback) => {
  const { id } = event.pathParameters;

  try {
    await Secret.delete({ id });
    callback(null, response(204));
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
