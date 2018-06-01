const expect = require('../../helpers/chai').expect;
const { encrypt, decrypt } = require('../../../src/utils/crypto');
require('../../helpers/configYamlUtils').loadConfigYamlToEnv(process.env.NODE_ENV);

const encryptKey = process.env.ENCRYPT_KEY;

describe('crypto', () => {
  describe('encrypt', () => {
    it('should encrypt a text', () => {
      const encrypted = encrypt('text', encryptKey);
      expect(encrypted).to.be.a('string');
      expect(encrypted).to.equal('c504ffb1438aa14d2b5dce0fe0f7465e');
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted text', () => {
      const decrypted = decrypt('c504ffb1438aa14d2b5dce0fe0f7465e', encryptKey);
      expect(decrypted).to.be.a('string');
      expect(decrypted).to.equal('text');
    });
  });
});
