const uuid = require('uuid');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;
const { encrypt, decrypt } = require('../utils/crypto');

const API_PROVIDERS = {
  BITFLYER: 'bitflyer',
  ZAIF: 'zaif'
};

const options = {
  timestamps: true,
  useNativeBooleans: true,
  useDocumentTypes: true
};

const secretSchema = new Schema(
  {
    id: { type: String, hashKey: true, default: () => uuid.v4() },
    userId: { type: String, required: true, trim: true },
    kind: { type: String, trim: true },
    apiProvider: {
      type: String,
      required: true,
      validate: (value) => Object.values(API_PROVIDERS).indexOf(value) !== -1
    },
    apiKey: { type: String, required: true, trim: true },
    apiSecret: { type: String, required: true, trim: true },
    version: { type: Number, required: true, default: 0 }
  },
  options
);

secretSchema.methods.encryptAndSave = function(encryptKey, options) {
  this.apiKey = encrypt(this.apiKey, encryptKey);
  this.apiSecret = encrypt(this.apiSecret, encryptKey);
  return this.save(options);
};

secretSchema.statics.getAndDecrypt = async function(id, encryptKey) {
  try {
    const secret = await this.get(id);
    secret.apiKey = decrypt(secret.apiKey, encryptKey);
    secret.apiSecret = decrypt(secret.apiSecret, encryptKey);
    return secret;
  } catch (error) {
    return error;
  }
};

secretSchema.statics.getAll = async function() {
  let results = await this.scan().exec();
  while (results.lastKey) {
    results = await this.scan().startKey(results.startKey).exec();
  }
  return results;
};

const Secret = dynamoose.model('secrets', secretSchema);

module.exports = {
  Secret
};
