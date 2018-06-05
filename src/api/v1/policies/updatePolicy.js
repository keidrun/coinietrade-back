const { Policy } = require('../../../models/Policy');
const { response, responseError, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../messages/apiMessages');
const apiErrors = require('../../../messages/apiErrors');

module.exports.updatePolicy = async (event, callback) => {
  const { userId } = event.pathParameters;
  const { effect, grade, ruleLimit } = JSON.parse(event.body);

  let policy = {};
  if (effect) policy.effect = effect;
  if (grade) policy.grade = grade;
  if (ruleLimit) policy.ruleLimit = ruleLimit;

  try {
    const existingPolicy = await Policy.get(userId);
    if (existingPolicy) {
      const updatedPolicy = await Policy.updateWithVersion({ userId }, policy);
      callback(null, response(200, updatedPolicy));
    } else {
      responseError(
        404,
        apiMessages.errors.POLICY_API_MESSAGE_UPDATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.POLICY_UPDATE_DATA_NOT_FOUND_BY_ID,
        event
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
        event
      )
    );
  }
};
