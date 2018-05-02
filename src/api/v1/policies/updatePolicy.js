const { Policy } = require('../../../models/Policy');
const { response, responseErrorFromDynamodb } = require('../../utils/response');
const apiMessages = require('../../utils/apiMessages');

module.exports.updatePolicy = (event, callback) => {
  const { id } = event.pathParameters;
  const { effect } = JSON.parse(event.body);

  let policy = {};
  if (effect) policy.effect = effect;

  Policy.update({ id }, { $PUT: policy })
    .then(updatedTodo => callback(null, response(200, updatedTodo)))
    .catch(err =>
      callback(
        null,
        responseErrorFromDynamodb(
          apiMessages.errors.POLICY_API_MESSAGE_UPDATE_FAILED,
          event.httpMethod,
          event.path,
          err,
          event
        )
      )
    );
};
