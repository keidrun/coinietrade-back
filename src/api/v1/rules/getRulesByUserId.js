const { Rule } = require('../../../models/Rule');
const { response, responseError, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../messages/apiMessages');
const apiErrors = require('../../../messages/apiErrors');

module.exports.getRulesByUserId = async (event, callback) => {
  const { userId } = event.pathParameters;

  try {
    const rules = await Rule.query('userId').eq(userId).exec();
    if (rules) {
      callback(null, response(200, rules));
    } else {
      responseError(
        404,
        apiMessages.errors.RULE_API_MESSAGE_READ_BY_USER_ID_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_READ_DATA_NOT_FOUND_BY_USER_ID,
        event
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.RULE_API_MESSAGE_READ_BY_USER_ID_FAILED,
        event.httpMethod,
        event.path,
        error,
        event
      )
    );
  }
};
