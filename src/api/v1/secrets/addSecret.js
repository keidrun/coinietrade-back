const { Secret } = require('../../../models/Secret');
const { response, responseError, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../utils/apiMessages');
const apiErrors = require('../../../utils/apiErrors');
const encryptKey = process.env.ENCRYPT_KEY;

module.exports.addSecret = async (event, callback) => {
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
        event
      )
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
        event
      )
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
        event
      )
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
        event
      )
    );
  }

  const secret = { userId, apiProvider, apiKey, apiSecret };
  const newSecret = new Secret(secret);
  try {
    const duplicateSecrets = await Secret.scan('userId').contains(userId).exec();
    if (duplicateSecrets.count <= 0) {
      const addedSecret = await newSecret.encryptAndSave(encryptKey, { overwrite: false });
      callback(
        null,
        response(201, {
          id: addedSecret.id,
          userId: addedSecret.userId,
          apiProvider: addedSecret.apiProvider,
          createdAt: addedSecret.createdAt,
          updatedAt: addedSecret.updatedAt
        })
      );
    } else {
      callback(
        null,
        responseError(
          400,
          apiMessages.errors.SECRET_API_MESSAGE_CREATE_FAILED,
          event.httpMethod,
          event.path,
          apiErrors.errors.SECRET_DUPLICATE_USER_ID,
          event
        )
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.SECRET_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event
      )
    );
  }
};
