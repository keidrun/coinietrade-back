const { Rule } = require('../../../models');
const { apiResponse } = require('../../../utils');
const { response, responseErrorFromDynamodb } = apiResponse;
const { apiMessages } = require('../../../messages');

const getRules = async (event, callback) => {
  try {
    const rules = await Rule.getAll();
    callback(null, response(200, rules));
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.RULE_API_MESSAGE_READ_LIST_FAILED,
        event.httpMethod,
        event.path,
        error,
        event,
      ),
    );
  }
};

module.exports = getRules;
