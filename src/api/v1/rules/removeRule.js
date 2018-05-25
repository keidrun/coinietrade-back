const { Rule } = require('../../../models/Rule');
const { response, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../utils/apiMessages');

module.exports.removeRule = async (event, callback) => {
  const { id } = event.pathParameters;

  try {
    await Rule.delete({ id });
    callback(null, response(204));
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.RULE_API_MESSAGE_DELETE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event
      )
    );
  }
};
