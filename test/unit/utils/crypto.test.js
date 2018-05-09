const expect = require('../../helpers/chai').expect;
const { encrypt, decrypt } = require('../../../src/utils/crypto');

const userIdAsEncryptKey = 'cb3dc780-484f-11e8-a0b9-c36d84fa8971';

describe('crypto', () => {
  describe('encrypt', () => {
    it('should encrypt a text', () => {
      const encrypted = encrypt('text', userIdAsEncryptKey);
      expect(encrypted).to.be.a('string');
      expect(encrypted).to.equal('c712f8c8f9ee319411ab1a657dea0c98');
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted text', () => {
      const decrypted = decrypt(
        'c712f8c8f9ee319411ab1a657dea0c98',
        userIdAsEncryptKey
      );
      expect(decrypted).to.be.a('string');
      expect(decrypted).to.equal('text');
    });
  });
});
