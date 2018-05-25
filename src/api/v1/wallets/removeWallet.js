const { Wallet } = require('../../../models/Wallet');
const { response, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../utils/apiMessages');

module.exports.removeWallet = async (event, callback) => {
  const { id } = event.pathParameters;

  try {
    await Wallet.delete({ id });
    callback(null, response(204));
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
