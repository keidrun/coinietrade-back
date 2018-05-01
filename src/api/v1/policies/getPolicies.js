const { Policy } = require('../../../models/Policy');
const { response } = require('../../utils/response');

module.exports.getPolicies = (event, callback) => {
  Policy.scan()
    .exec()
    .then(policies => callback(null, response(200, policies)))
    .catch(err =>
      callback(
        null,
        response(500, {
          error: err
        })
      )
    );
};
