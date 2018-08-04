const uuid = require('uuid');
const axios = require('../../../helpers/axios');
require('../../../helpers/configYamlUtils').loadConfigYamlToEnv(
  process.env.NODE_ENV,
);
const { Secret } = require('../../../../src/models/Secret');

beforeAll(() => {
  // Clear all secrets items
  return Secret.getAll().then(existingSecrets => {
    return existingSecrets.forEach(secret => {
      return Secret.delete({
        userId: secret.userId,
        secretId: secret.secretId,
      });
    });
  });
});

afterAll(() => {
  // Clear all secrets items
  return Secret.getAll().then(existingSecrets => {
    return existingSecrets.forEach(secret => {
      return Secret.delete({
        userId: secret.userId,
        secretId: secret.secretId,
      });
    });
  });
});

describe('secrets endpoints', () => {
  const existingSecrets = [];

  describe('POST /v1/secrets', () => {
    test('should fetch added data whose apiProvider is bitflyer', async () => {
      const response = await axios.post(`/v1/secrets`, {
        userId: uuid.v4(),
        apiProvider: 'bitflyer',
        apiKey: 'ANY_API_KEY',
        apiSecret: 'ANY_API_SECRET',
      });

      expect(response.data.apiProvider).toBe('bitflyer');
      expect(response.data.apiKey).toBeUndefined();
      expect(response.data.apiSecret).toBeUndefined();
      existingSecrets.push(response.data);
    });

    test('should fetch added data whose apiProvider is zaif', async () => {
      const response = await axios.post(`/v1/secrets`, {
        userId: uuid.v4(),
        apiProvider: 'zaif',
        apiKey: 'ANY_API_KEY',
        apiSecret: 'ANY_API_SECRET',
      });

      expect(response.data.apiProvider).toBe('zaif');
      expect(response.data.apiKey).toBeUndefined();
      expect(response.data.apiSecret).toBeUndefined();
      existingSecrets.push(response.data);
    });
  });

  describe('DELETE /v1/secrets/{userId}/{secretId}', () => {
    test('should fetch 204 status', async () => {
      const expectedToDeleteSecret =
        existingSecrets[existingSecrets.length - 1];
      const response = await axios.delete(
        `/v1/secrets/${expectedToDeleteSecret.userId}/${
          expectedToDeleteSecret.secretId
        }`,
      );

      expect(response.status).toBe(204);
      expect(response.data).toBe('');
      existingSecrets.pop();
    });

    test('should fetch 404 status when any data NOT exit', async () => {
      const userId = 'none';
      try {
        await axios.delete(`/v1/secrets/${userId}`);
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});
