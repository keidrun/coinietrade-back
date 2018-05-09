const { Policy } = require('../../../models/Policy');
const {
  response,
  responseErrorFromDynamodb
} = require('../../../utils/response');
const apiMessages = require('../../../utils/apiMessages');

module.exports.removePolicy = async (event, callback) => {
  const { id } = event.pathParameters;

  try {
    await Policy.delete({ id });
    callback(null, response(204));
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.POLICY_API_MESSAGE_DELETE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event
      )
    );
  }
};
