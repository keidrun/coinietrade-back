const moment = require('moment');
const { Ticket } = require('../../../models/Ticket');
const { response, responseError, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../utils/apiMessages');
const apiErrors = require('../../../utils/apiErrors');

module.exports.getTicket = async (event, callback) => {
  const { id } = event.pathParameters;

  try {
    const ticket = await Ticket.get(id);
    if (ticket) {
      ticket.expiredAt = moment.unix(ticket.expiredAt / 1000).toISOString();
      callback(null, response(200, ticket));
    } else {
      responseError(
        404,
        apiMessages.errors.TICKET_API_MESSAGE_READ_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.TICKET_READ_DATA_NOT_FOUND_BY_ID,
        event
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.TICKET_API_MESSAGE_READ_FAILED,
        event.httpMethod,
        event.path,
        error,
        event
      )
    );
  }
};
