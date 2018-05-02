const { Policy } = require('../../../models/Policy');
const {
  response,
  responseError,
  responseErrorFromDynamodb
} = require('../../utils/response');
const apiMessages = require('../../utils/apiMessages');
const apiErrors = require('../../utils/apiErrors');

module.exports.getPolicy = (event, callback) => {
  const { id } = event.pathParameters;

  Policy.get(id)
    .then(
      policy =>
        policy
          ? callback(null, response(200, policy))
          : callback(
              null,
              responseError(
                404,
                apiMessages.errors.POLICY_API_MESSAGE_DATA_NOT_FOUND,
                event.httpMethod,
                event.path,
                apiErrors.errors.POLICY_READ_DATA_NOT_FOUND_BY_ID,
                event
              )
            )
    )
    .catch(err =>
      callback(
        null,
        responseErrorFromDynamodb(
          apiMessages.errors.POLICY_API_MESSAGE_READ_FAILED,
          event.httpMethod,
          event.path,
          err,
          event
        )
      )
    );
};
