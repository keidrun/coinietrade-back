const { Policy } = require('../../../models');
const { apiResponse } = require('../../../utils');
const { response, responseError, responseErrorFromDynamodb } = apiResponse;
const { apiMessages, apiErrors } = require('../../../messages');

const updatePolicy = async (event, callback) => {
  const { userId } = event.pathParameters;
  const { effect, grade, ruleLimit, expiredAt } = JSON.parse(event.body);

  let policy = {};
  if (effect) policy.effect = effect;
  if (grade) policy.grade = grade;
  if (ruleLimit) policy.ruleLimit = ruleLimit;
  if (expiredAt) policy.expiredAt = expiredAt;

  try {
    const existingPolicy = await Policy.get(userId);
    if (existingPolicy) {
      const updatedPolicy = await Policy.updateWithVersion({ userId }, policy);
      callback(null, response(200, updatedPolicy));
    } else {
      callback(
        null,
        responseError(
          404,
          apiMessages.errors.POLICY_API_MESSAGE_UPDATE_FAILED,
          event.httpMethod,
          event.path,
          apiErrors.errors.POLICY_UPDATE_DATA_NOT_FOUND_BY_ID,
          event,
        ),
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.POLICY_API_MESSAGE_UPDATE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event,
      ),
    );
  }
};

module.exports = updatePolicy;
