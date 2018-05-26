const { Rule } = require('../../../models/Rule');
const { response, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../messages/apiMessages');

module.exports.getRules = async (event, callback) => {
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
        event
      )
    );
  }
};
