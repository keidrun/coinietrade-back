const { Policy } = require('../../../models/Policy');
const {
  response,
  responseError,
  responseErrorFromDynamodb
} = require('../../utils/response');
const apiMessages = require('../../utils/apiMessages');
const apiErrors = require('../../utils/apiErrors');

module.exports.getPolicy = async (event, callback) => {
  const { id } = event.pathParameters;

  try {
    const policy = await Policy.get(id);
    if (policy) {
      callback(null, response(200, policy));
    } else {
      responseError(
        404,
        apiMessages.errors.POLICY_API_MESSAGE_READ_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.POLICY_READ_DATA_NOT_FOUND_BY_ID,
        event
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.POLICY_API_MESSAGE_READ_FAILED,
        event.httpMethod,
        event.path,
        error,
        event
      )
    );
  }
};
