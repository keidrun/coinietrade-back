const { Rule } = require('../../../models');
const { apiResponse } = require('../../../utils');
const { response, responseErrorFromDynamodb } = apiResponse;
const { apiMessages } = require('../../../messages');

const getRule = async (event, callback) => {
  const { userId, ruleId } = event.pathParameters;

  try {
    const rule = await Rule.queryOne('userId')
      .eq(userId)
      .where('ruleId')
      .eq(ruleId)
      .exec();
    callback(null, response(200, rule));
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.RULE_API_MESSAGE_READ_ONE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event,
      ),
    );
  }
};

module.exports = getRule;
