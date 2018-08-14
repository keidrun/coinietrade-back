const { Policy } = require('../../../models');
const { apiResponse } = require('../../../utils');
const { response, responseErrorFromDynamodb } = apiResponse;
const { apiMessages } = require('../../../messages');

const getPolicies = async (event, callback) => {
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

module.exports = getPolicies;
