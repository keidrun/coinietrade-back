const { Policy } = require('../../../models/Policy');
const {
  response,
  responseError,
  responseErrorFromDynamodb,
} = require('../../../utils/response');
const apiMessages = require('../../../messages/apiMessages');
const apiErrors = require('../../../messages/apiErrors');

module.exports.removePolicy = async (event, callback) => {
  const { userId } = event.pathParameters;

  try {
    const existingPolicy = await Policy.get(userId);
    if (existingPolicy) {
      await Policy.deleteWithVersion({ userId });
      callback(null, response(204));
    } else {
      responseError(
        404,
        apiMessages.errors.POLICY_API_MESSAGE_DELETE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.POLICY_DELETE_DATA_NOT_FOUND_BY_USER_ID,
        event,
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.POLICY_API_MESSAGE_DELETE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event,
      ),
    );
  }
};
