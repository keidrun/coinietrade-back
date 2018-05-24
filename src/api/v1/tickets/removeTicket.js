const { Ticket } = require('../../../models/Ticket');
const { response, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../utils/apiMessages');

module.exports.removeTicket = async (event, callback) => {
  const { id } = event.pathParameters;

  try {
    await Ticket.delete({ id });
    callback(null, response(204));
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.TICKET_API_MESSAGE_DELETE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event
      )
    );
  }
};
