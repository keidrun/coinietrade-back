const { Rule } = require('../../../models/Rule');
const { response, responseError, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../messages/apiMessages');
const apiErrors = require('../../../messages/apiErrors');

module.exports.removeRule = async (event, callback) => {
  const { userId, ruleId } = event.pathParameters;

  try {
    const existingRule = await Rule.get({ userId, ruleId });
    if (existingRule) {
      await Rule.deleteWithVersion({ userId, ruleId });
      callback(null, response(204));
    } else {
      responseError(
        404,
        apiMessages.errors.RULE_API_MESSAGE_DELETE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_DELETE_DATA_NOT_FOUND_BY_IDS,
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
