const { Secret } = require('../../../models');
const { apiResponse } = require('../../../utils');
const { response, responseError, responseErrorFromDynamodb } = apiResponse;
const { apiMessages, apiErrors } = require('../../../messages');
const encryptKey = process.env.ENCRYPT_KEY;

const addSecret = async (event, callback) => {
  const { userId, apiProvider, apiKey, apiSecret } = JSON.parse(event.body);

  if (!userId) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.SECRET_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.SECRET_MISSING_USER_ID,
        event,
      ),
    );
  }

  if (!apiProvider) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.SECRET_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.SECRET_MISSING_API_PROVIDER,
        event,
      ),
    );
  }

  if (!apiKey) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.SECRET_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.SECRET_MISSING_API_KEY,
        event,
      ),
    );
  }

  if (!apiSecret) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.SECRET_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.SECRET_MISSING_API_SECRET,
        event,
      ),
    );
  }

  const secret = { userId, apiProvider, apiKey, apiSecret };
  const newSecret = new Secret(secret);
  try {
    const addedSecret = await newSecret.encryptAndSave(encryptKey, {
      overwrite: false,
    });
    callback(
      null,
      response(201, {
        userId: addedSecret.userId,
        secretId: addedSecret.secretId,
        apiProvider: addedSecret.apiProvider,
        createdAt: addedSecret.createdAt,
        updatedAt: addedSecret.updatedAt,
      }),
    );
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.SECRET_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event,
      ),
    );
  }
};

module.exports = addSecret;
