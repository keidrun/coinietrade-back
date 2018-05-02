const { Policy } = require('../../../models/Policy');
const { response, responseErrorFromDynamodb } = require('../../utils/response');
const apiMessages = require('../../utils/apiMessages');

module.exports.getPolicies = (event, callback) => {
  Policy.scan()
    .exec()
    .then(policies => callback(null, response(200, policies)))
    .catch(err =>
      callback(
        null,
        responseErrorFromDynamodb(
          apiMessages.errors.POLICY_API_MESSAGE_READ_LIST_FAILED,
          event.httpMethod,
          event.path,
          err,
          event
        )
      )
    );
};
