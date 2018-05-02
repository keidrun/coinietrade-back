const { Policy } = require('../../../models/Policy');
const { response, responseErrorFromDynamodb } = require('../../utils/response');
const apiMessages = require('../../utils/apiMessages');

module.exports.removePolicy = (event, callback) => {
  const { id } = event.pathParameters;

  Policy.delete({ id })
    .then(() => callback(null, response(204)))
    .catch(err =>
      callback(
        null,
        responseErrorFromDynamodb(
          apiMessages.errors.POLICY_API_MESSAGE_DELETE_FAILED,
          event.httpMethod,
          event.path,
          err,
          event
        )
      )
    );
};
