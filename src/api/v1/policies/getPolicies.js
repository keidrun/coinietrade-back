const { Policy } = require('../../../models/Policy');
const {
  response,
  responseErrorFromDynamodb,
} = require('../../../utils/response');
const apiMessages = require('../../../messages/apiMessages');

module.exports.getPolicies = async (event, callback) => {
  try {
    const policies = await Policy.getAll();
    callback(null, response(200, policies));
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.POLICY_API_MESSAGE_READ_LIST_FAILED,
        event.httpMethod,
        event.path,
        error,
        event,
      ),
    );
  }
};
