const expect = require('../../helpers/chai').expect;
const { encrypt, decrypt } = require('../../../src/utils/crypto');
require('../../helpers/configYamlUtils').loadConfigYamlToEnv(process.env.NODE_ENV);

const encryptKey = process.env.ENCRYPT_KEY;

describe('crypto', () => {
  describe('encrypt', () => {
    it('should encrypt a text', () => {
      const encrypted = encrypt('text', encryptKey);
      expect(encrypted).to.be.a('string');
      expect(encrypted).to.equal('661f0751c94112f9817c4ff1d9a6d72f');
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted text', () => {
      const decrypted = decrypt('661f0751c94112f9817c4ff1d9a6d72f', encryptKey);
      expect(decrypted).to.be.a('string');
      expect(decrypted).to.equal('text');
    });
  });
});
