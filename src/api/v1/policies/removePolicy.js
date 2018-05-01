const { Policy } = require('../../../models/Policy');
const { response } = require('../../utils/response');

module.exports.removePolicy = (event, callback) => {
  const { id } = event.pathParameters;

  Policy.delete({ id })
    .then(() => callback(null, response(204)))
    .catch(err =>
      callback(
        null,
        response(500, {
          error: err
        })
      )
    );
};
