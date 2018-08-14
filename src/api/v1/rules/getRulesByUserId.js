const { Rule, RULE_STATUS } = require('../../../models');
const { apiResponse } = require('../../../utils');
const { response, responseError, responseErrorFromDynamodb } = apiResponse;
const { apiMessages, apiErrors } = require('../../../messages');

const getRulesByUserId = async (event, callback) => {
  const { userId } = event.pathParameters;

  try {
    const rules = await Rule.query('userId')
      .eq(userId)
      .filter('status')
      .in([RULE_STATUS.AVAILABLE, RULE_STATUS.UNAVAILABLE, RULE_STATUS.LOCKED])
      .exec();
    if (rules) {
      callback(null, response(200, rules));
    } else {
      callback(
        null,
        responseError(
          404,
          apiMessages.errors.RULE_API_MESSAGE_READ_BY_USER_ID_FAILED,
          event.httpMethod,
          event.path,
          apiErrors.errors.RULE_READ_DATA_NOT_FOUND_BY_USER_ID,
          event,
        ),
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
        event,
      ),
    );
  }
};

module.exports = getRulesByUserId;
