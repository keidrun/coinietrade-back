const crypto = require('crypto');
const ALGORITHM = 'aes-128-cbc';

function encrypt(rawText, encryptKey) {
  const cipher = crypto.createCipher(ALGORITHM, encryptKey);
  let encrypted = cipher.update(rawText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText, encryptKey) {
  const decipher = crypto.createDecipher(ALGORITHM, encryptKey);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
