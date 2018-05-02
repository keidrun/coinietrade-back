const { Policy } = require('../../../models/Policy');
const {
  response,
  responseError,
  responseErrorFromDynamodb
} = require('../../utils/response');
const apiMessages = require('../../utils/apiMessages');
const apiErrors = require('../../utils/apiErrors');

module.exports.addPolicy = async (event, callback) => {
  const { userId, effect } = JSON.parse(event.body);

  if (!userId) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.POLICY_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.POLICY_MISSING_USER_ID,
        event
      )
    );
  }

  let policy = { userId };
  if (effect) policy.effect = effect;

  const newPolicy = new Policy(policy);
  try {
    const duplicatePolicies = await Policy.scan('userId')
      .contains(userId)
      .exec();
    if (duplicatePolicies.count <= 0) {
      const addedPolicy = await newPolicy.save({ overwrite: false });
      callback(null, response(201, addedPolicy));
    } else {
      callback(
        null,
        responseError(
          400,
          apiMessages.errors.POLICY_API_MESSAGE_CREATE_FAILED,
          event.httpMethod,
          event.path,
          apiErrors.errors.POLICY_DUPLICATE_USER_ID,
          event
        )
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.POLICY_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event
      )
    );
  }
};
