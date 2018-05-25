const { Wallet } = require('../../../models/Wallet');
const { response, responseError, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../messages/apiMessages');
const apiErrors = require('../../../messages/apiErrors');
const encryptKey = process.env.ENCRYPT_KEY;

module.exports.addWallet = async (event, callback) => {
  const { userId, company, addressType, address } = JSON.parse(event.body);

  if (!userId) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.WALLET_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.WALLET_MISSING_USER_ID,
        event
      )
    );
  }

  if (!company) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.WALLET_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.WALLET_MISSING_COMPANY,
        event
      )
    );
  }

  if (!addressType) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.WALLET_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.WALLET_MISSING_ADDRESS_TYPE,
        event
      )
    );
  }

  if (!address) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.WALLET_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.WALLET_MISSING_ADDRESS,
        event
      )
    );
  }

  const wallet = { userId, company, addressType, address };
  const newWallet = new Wallet(wallet);
  try {
    const duplicateWallets = await Wallet.scan('userId').contains(userId).exec();
    if (duplicateWallets.count <= 0) {
      const addedWallet = await newWallet.encryptAndSave(encryptKey, { overwrite: false });
      callback(
        null,
        response(201, {
          id: addedWallet.id,
          userId: addedWallet.userId,
          company: addedWallet.company,
          addressType: addedWallet.addressType,
          createdAt: addedWallet.createdAt,
          updatedAt: addedWallet.updatedAt
        })
      );
    } else {
      callback(
        null,
        responseError(
          400,
          apiMessages.errors.WALLET_API_MESSAGE_CREATE_FAILED,
          event.httpMethod,
          event.path,
          apiErrors.errors.WALLET_DUPLICATE_USER_ID,
          event
        )
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.WALLET_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event
      )
    );
  }
};
