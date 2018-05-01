const { Policy } = require('../../../models/Policy');
const { response } = require('../../utils/response');

module.exports.getPolicy = (event, callback) => {
  const { id } = event.pathParameters;

  Policy.get(id)
    .then(
      policy =>
        policy
          ? callback(null, response(200, policy))
          : callback(null, response(404))
    )
    .catch(err =>
      callback(
        null,
        response(500, {
          error: err
        })
      )
    );
};
