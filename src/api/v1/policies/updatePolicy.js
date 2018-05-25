const { Policy } = require('../../../models/Policy');
const { response, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../utils/apiMessages');

module.exports.updatePolicy = async (event, callback) => {
  const { id } = event.pathParameters;
  const { effect, grade, ruleLimit } = JSON.parse(event.body);

  let policy = {};
  if (effect) policy.effect = effect;
  if (grade) policy.grade = grade;
  if (ruleLimit) policy.ruleLimit = ruleLimit;

  try {
    const updatedPolicy = await Policy.update({ id }, { $PUT: policy });
    callback(null, response(200, updatedPolicy));
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
