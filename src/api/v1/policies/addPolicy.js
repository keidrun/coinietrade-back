const { Policy, EFFECTS } = require('../../../models/Policy');
const {
  response,
  responseError,
  responseErrorFromDynamodb
} = require('../../utils/response');
const apiMessages = require('../../utils/apiMessages');
const apiErrors = require('../../utils/apiErrors');

module.exports.addPolicy = (event, callback) => {
  const { userId, effect } = JSON.parse(event.body);

  if (!userId) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.POLICY_API_MESSAGE_VALIDATION_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.POLICY_MISSING_USER_ID,
        event
      )
    );
  }

  let policy = { userId };
  if (effect) {
    const isCorrectEffect =
      [EFFECTS.ALLOW, EFFECTS.DENY, EFFECTS.CANCELED].filter(
        value => effect === value
      ).length === 1;

    if (isCorrectEffect) {
      policy.effect = effect;
    } else {
      return callback(
        null,
        responseError(
          400,
          apiMessages.errors.POLICY_API_MESSAGE_VALIDATION_FAILED,
          event.httpMethod,
          event.path,
          apiErrors.errors.POLICY_FORMAT_KINDS_OF_EFFECT,
          event
        )
      );
    }
  }

  const newPolicy = new Policy(policy);
  newPolicy
    .save({ overwrite: false })
    .then(addedPolicy => callback(null, response(201, addedPolicy)))
    .catch(err =>
      callback(
        null,
        responseErrorFromDynamodb(
          apiMessages.errors.POLICY_API_MESSAGE_CREATE_FAILED,
          event.httpMethod,
          event.path,
          err,
          event
        )
      )
    );
};
