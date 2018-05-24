const moment = require('moment');
const { Ticket } = require('../../../models/Ticket');
const { response, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../utils/apiMessages');

module.exports.updateTicket = async (event, callback) => {
  const { id } = event.pathParameters;
  const { times, expiredAt } = JSON.parse(event.body);

  let ticket = {};
  if (times) ticket.times = times;
  if (expiredAt) ticket.expiredAt = expiredAt;

  try {
    const updatedTicket = await Ticket.update({ id }, { $PUT: ticket });
    updatedTicket.expiredAt = moment.unix(updatedTicket.expiredAt / 1000).toISOString();
    callback(null, response(200, updatedTicket));
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.TICKET_API_MESSAGE_UPDATE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event
      )
    );
  }
};
