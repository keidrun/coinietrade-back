const uuid = require('uuid');
const expect = require('../../../helpers/chai').expect;
const axios = require('../../../helpers/axios');
const keys = require('../../../helpers/keys').get(process.env.NODE_ENV);
require('../../../helpers/configYamlUtils').loadConfigYamlToEnv(process.env.NODE_ENV);
const { Ticket } = require('../../../../src/models/Ticket');
const { sortByCreatedAt } = require('../../../helpers/testUtils');

before(() => {
  // Clear all tickets items
  return Ticket.scan().exec().then((existingTickets) => {
    return existingTickets.forEach((ticket) => {
      return Ticket.delete({ id: ticket.id });
    });
  });
});

after(() => {
  // Clear all tickets items
  return Ticket.scan().exec().then((existingTickets) => {
    return existingTickets.forEach((ticket) => {
      return Ticket.delete({ id: ticket.id });
    });
  });
});

describe('tickets endpoints', () => {
  const existingTickets = [];

  describe('POST /v1/tickets', () => {
    it('should return added data response', (done) => {
      axios
        .post(`/v1/tickets`, { userId: uuid.v4(), times: 10, expiredAt: 1524831297800 })
        .then((response) => {
          expect(response.data.times).to.equal(10);
          expect(response.data.expiredAt).to.equal('2018-04-27T12:14:57.800Z');
          existingTickets.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    it('should return added data response specified times', (done) => {
      axios
        .post(`/v1/tickets`, { userId: uuid.v4(), times: 777 })
        .then((response) => {
          expect(response.data.times).to.equal(777);
          existingTickets.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    it('should return added data response specified expiredAt', (done) => {
      axios
        .post(`/v1/tickets`, { userId: uuid.v4(), expiredAt: 1524831297800 })
        .then((response) => {
          expect(response.data.times).to.equal(0);
          expect(response.data.expiredAt).to.equal('2018-04-27T12:14:57.800Z');
          existingTickets.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    it('should return added data response specified none fields', (done) => {
      axios
        .post(`/v1/tickets`, { userId: uuid.v4() })
        .then((response) => {
          expect(response.data.times).to.equal(0);
          existingTickets.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('GET /v1/tickets/{id}', () => {
    it('should return one data response', (done) => {
      axios
        .get(`/v1/tickets/${existingTickets[0].id}`)
        .then((response) => {
          const ticket = response.data;

          expect(ticket).to.deep.equal({
            id: existingTickets[0].id,
            userId: existingTickets[0].userId,
            times: existingTickets[0].times,
            expiredAt: existingTickets[0].expiredAt,
            createdAt: existingTickets[0].createdAt,
            updatedAt: existingTickets[0].updatedAt
          });
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('DELETE /v1/tickets/{id}', () => {
    it('should return 204 status', (done) => {
      const expectedToDeleteTicket = existingTickets[existingTickets.length - 1];

      axios
        .delete(`/v1/tickets/${expectedToDeleteTicket.id}`)
        .then((response) => {
          expect(response.status).to.equal(204);
          expect(response.data).to.be.empty;
          existingTickets.pop();
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('PATCH /v1/tickets/{id}', () => {
    it('should return updated data response', (done) => {
      const expectedToUpdateTicket = existingTickets[0];

      axios
        .patch(`/v1/tickets/${expectedToUpdateTicket.id}`, { times: 111, expiredAt: 1525986043000 })
        .then((response) => {
          const updatedTicket = response.data;
          expectedToUpdateTicket.times = 111;
          expectedToUpdateTicket.expiredAt = '2018-05-10T21:00:43.000Z';

          expect(updatedTicket.id).to.equal(expectedToUpdateTicket.id);
          expect(updatedTicket.times).to.equal(expectedToUpdateTicket.times);
          expect(updatedTicket.expiredAt).to.equal(expectedToUpdateTicket.expiredAt);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });
});
