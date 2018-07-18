const uuid = require('uuid');
const axios = require('../../../helpers/axios');
const keys = require('../../../helpers/keys').get(process.env.NODE_ENV);
require('../../../helpers/configYamlUtils').loadConfigYamlToEnv(process.env.NODE_ENV);
const { Secret } = require('../../../../src/models/Secret');
const { sortByCreatedAt } = require('../../../helpers/testUtils');

beforeAll(() => {
  // Clear all secrets testems
  return Secret.getAll().then((existingSecrets) => {
    return existingSecrets.forEach((secret) => {
      return Secret.delete({ userId: secret.userId, secretId: secret.secretId });
    });
  });
});

afterAll(() => {
  // Clear all secrets testems
  return Secret.getAll().then((existingSecrets) => {
    return existingSecrets.forEach((secret) => {
      return Secret.delete({ userId: secret.userId, secretId: secret.secretId });
    });
  });
});

describe('secrets endpoints', () => {
  const existingSecrets = [];

  describe('POST /v1/secrets', () => {
    test('should return added data response of bitflyer', (done) => {
      axios
        .post(`/v1/secrets`, {
          userId: uuid.v4(),
          apiProvider: 'bitflyer',
          apiKey: 'ANY_API_KEY',
          apiSecret: 'ANY_API_SECRET'
        })
        .then((response) => {
          expect(response.data.apiProvider).toBe('bitflyer');
          expect(response.data.apiKey).toBeUndefined();
          expect(response.data.apiSecret).toBeUndefined();
          existingSecrets.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    test('should return added data response of zaif', (done) => {
      axios
        .post(`/v1/secrets`, {
          userId: uuid.v4(),
          apiProvider: 'zaif',
          apiKey: 'ANY_API_KEY',
          apiSecret: 'ANY_API_SECRET'
        })
        .then((response) => {
          expect(response.data.apiProvider).toBe('zaif');
          expect(response.data.apiKey).toBeUndefined();
          expect(response.data.apiSecret).toBeUndefined();
          existingSecrets.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('DELETE /v1/secrets/{userId}/{secretId}', () => {
    test('should return 204 status', (done) => {
      const expectedToDeleteSecret = existingSecrets[existingSecrets.length - 1];
      axios
        .delete(`/v1/secrets/${expectedToDeleteSecret.userId}/${expectedToDeleteSecret.secretId}`)
        .then((response) => {
          expect(response.status).toBe(204);
          expect(response.data).toBe("");
          existingSecrets.pop();
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });
});
