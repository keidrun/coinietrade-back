const { Rule, RULE_STATUS } = require('../../../models');
const { apiResponse } = require('../../../utils');
const { response, responseError, responseErrorFromDynamodb } = apiResponse;
const { apiMessages, apiErrors } = require('../../../messages');

const removeRule = async (event, callback) => {
  const { userId, ruleId } = event.pathParameters;

  try {
    const existingRule = await Rule.get({ userId, ruleId });
    if (existingRule) {
      await Rule.updateWithVersion(
        { userId, ruleId },
        {
          status: RULE_STATUS.DELETED,
        },
      );
      callback(null, response(204));
    } else {
      callback(
        null,
        responseError(
          404,
          apiMessages.errors.RULE_API_MESSAGE_DELETE_FAILED,
          event.httpMethod,
          event.path,
          apiErrors.errors.RULE_DELETE_DATA_NOT_FOUND_BY_IDS,
          event,
        ),
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
        event,
      ),
    );
  }
};

module.exports = removeRule;
