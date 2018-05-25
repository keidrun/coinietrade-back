const { Policy } = require('../../../models/Policy');
const { response, responseError, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../messages/apiMessages');
const apiErrors = require('../../../messages/apiErrors');

module.exports.updatePolicy = async (event, callback) => {
  const { id } = event.pathParameters;
  const { effect, grade, ruleLimit } = JSON.parse(event.body);

  let policy = {};
  if (effect) policy.effect = effect;
  if (grade) policy.grade = grade;
  if (ruleLimit) policy.ruleLimit = ruleLimit;

  try {
    const existingPolicy = await Policy.get(id);
    if (existingPolicy) {
      const version = existingPolicy.version;
      policy.version = version + 1;
      const updatedPolicy = await Policy.update({ id, version }, { $PUT: policy });
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
