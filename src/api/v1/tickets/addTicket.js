const moment = require('moment');
const { Ticket } = require('../../../models/Ticket');
const { response, responseError, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../utils/apiMessages');
const apiErrors = require('../../../utils/apiErrors');

module.exports.addTicket = async (event, callback) => {
  const { userId, times, expiredAt } = JSON.parse(event.body);

  if (!userId) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.TICKET_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.TICKET_MISSING_USER_ID,
        event
      )
    );
  }

  let ticket = { userId };
  if (times) ticket.times = times;
  if (expiredAt) ticket.expiredAt = expiredAt;

  const newTicket = new Ticket(ticket);
  try {
    const duplicateTickets = await Ticket.scan('userId').contains(userId).exec();
    if (duplicateTickets.count <= 0) {
      const addedTicket = await newTicket.save({ overwrite: false });
      addedTicket.expiredAt = moment.unix(addedTicket.expiredAt / 1000).toISOString();
      callback(null, response(201, addedTicket));
    } else {
      callback(
        null,
        responseError(
          400,
          apiMessages.errors.TICKET_API_MESSAGE_CREATE_FAILED,
          event.httpMethod,
          event.path,
          apiErrors.errors.TICKET_DUPLICATE_USER_ID,
          event
        )
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.TICKET_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event
      )
    );
  }
};
