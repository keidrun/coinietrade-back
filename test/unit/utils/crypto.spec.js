const { crypto } = require('../../../src/utils');
const { encrypt, decrypt } = crypto;
const { configYamlUtils } = require('../../helpers');
configYamlUtils.loadConfigYamlToEnv(process.env.NODE_ENV);
const encryptKey = process.env.ENCRYPT_KEY;

describe('crypto', () => {
  describe('encrypt', () => {
    test('should encrypt a text', () => {
      const encrypted = encrypt('text', encryptKey);
      expect(typeof encrypted).toBe('string');
      expect(encrypted).toBe('661f0751c94112f9817c4ff1d9a6d72f');
    });
  });

  describe('decrypt', () => {
    test('should decrypt an encrypted text', () => {
      const decrypted = decrypt('661f0751c94112f9817c4ff1d9a6d72f', encryptKey);
      expect(typeof decrypted).toBe('string');
      expect(decrypted).toBe('text');
    });
  });
});
