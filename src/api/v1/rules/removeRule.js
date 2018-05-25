const { Rule } = require('../../../models/Rule');
const { response, responseError, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../messages/apiMessages');
const apiErrors = require('../../../messages/apiErrors');

module.exports.removeRule = async (event, callback) => {
  const { id } = event.pathParameters;

  try {
    const existingRule = await Rule.get(id);
    if (existingRule) {
      const version = existingRule.version;
      await Rule.delete({ id, version });
      callback(null, response(204));
    } else {
      responseError(
        404,
        apiMessages.errors.RULE_API_MESSAGE_DELETE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_DELETE_DATA_NOT_FOUND_BY_ID,
        event
      );
    }
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
