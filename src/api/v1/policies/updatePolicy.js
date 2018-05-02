const { Policy } = require('../../../models/Policy');
const { response } = require('../../utils/response');

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
        response(500, {
          error: err
        })
      )
    );
};
