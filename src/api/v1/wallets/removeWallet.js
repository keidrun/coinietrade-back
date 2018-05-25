const { Wallet } = require('../../../models/Wallet');
const { response, responseError, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../utils/apiMessages');
const apiErrors = require('../../../utils/apiErrors');

module.exports.removeWallet = async (event, callback) => {
  const { id } = event.pathParameters;

  try {
    const existingWallet = await Wallet.get(id);
    if (existingWallet) {
      await Wallet.delete({ id });
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
