const { Wallet } = require('../../../models/Wallet');
const { response, responseError, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../messages/apiMessages');
const apiErrors = require('../../../messages/apiErrors');

module.exports.removeWallet = async (event, callback) => {
  const { id } = event.pathParameters;

  try {
    const existingWallet = await Wallet.get(id);
    if (existingWallet) {
      const version = existingWallet.version;
      await Wallet.delete({ id, version });
      callback(null, response(204));
    } else {
      responseError(
        404,
        apiMessages.errors.WALLET_API_MESSAGE_DELETE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.WALLET_DELETE_DATA_NOT_FOUND_BY_ID,
        event
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.WALLET_API_MESSAGE_DELETE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event
      )
    );
  }
};
