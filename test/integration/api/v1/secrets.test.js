const uuid = require('uuid');
const expect = require('../../../helpers/chai').expect;
const axios = require('../../../helpers/axios');
const keys = require('../../../helpers/keys').get(process.env.NODE_ENV);
require('../../../helpers/configYamlUtils').loadConfigYamlToEnv(process.env.NODE_ENV);
const { Secret } = require('../../../../src/models/Secret');
const { sortByCreatedAt } = require('../../../helpers/testUtils');

before(() => {
  // Clear all secrets items
  return Secret.getAll().then((existingSecrets) => {
    return existingSecrets.forEach((secret) => {
      return Secret.delete({ userId: secret.userId, secretId: secret.secretId });
    });
  });
});

after(() => {
  // Clear all secrets items
  return Secret.getAll().then((existingSecrets) => {
    return existingSecrets.forEach((secret) => {
      return Secret.delete({ userId: secret.userId, secretId: secret.secretId });
    });
  });
});

describe('secrets endpoints', () => {
  const existingSecrets = [];

  describe('POST /v1/secrets', () => {
    it('should return added data response of bitflyer', (done) => {
      axios
        .post(`/v1/secrets`, {
          userId: uuid.v4(),
          apiProvider: 'bitflyer',
          apiKey: 'ANY_API_KEY',
          apiSecret: 'ANY_API_SECRET'
        })
        .then((response) => {
          expect(response.data.apiProvider).to.equal('bitflyer');
          expect(response.data.apiKey).to.be.undefined;
          expect(response.data.apiSecret).to.be.undefined;
          existingSecrets.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    it('should return added data response of zaif', (done) => {
      axios
        .post(`/v1/secrets`, {
          userId: uuid.v4(),
          apiProvider: 'zaif',
          apiKey: 'ANY_API_KEY',
          apiSecret: 'ANY_API_SECRET'
        })
        .then((response) => {
          expect(response.data.apiProvider).to.equal('zaif');
          expect(response.data.apiKey).to.be.undefined;
          expect(response.data.apiSecret).to.be.undefined;
          existingSecrets.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('DELETE /v1/secrets/{userId}/{secretId}', () => {
    it('should return 204 status', (done) => {
      const expectedToDeleteSecret = existingSecrets[existingSecrets.length - 1];
      axios
        .delete(`/v1/secrets/${expectedToDeleteSecret.userId}/${expectedToDeleteSecret.secretId}`)
        .then((response) => {
          expect(response.status).to.equal(204);
          expect(response.data).to.be.empty;
          existingSecrets.pop();
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });
});
