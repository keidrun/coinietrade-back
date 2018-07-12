const uuid = require('uuid');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;
const { encrypt, decrypt } = require('../utils/crypto');
const { EXCHANGE_SITES } = require('./Rule');

const API_PROVIDERS = {
  ...EXCHANGE_SITES,
};

const options = {
  timestamps: true,
  useNativeBooleans: true,
  useDocumentTypes: true,
};

const secretSchema = new Schema(
  {
    userId: { type: String, hashKey: true, required: true, trim: true },
    secretId: { type: String, rangeKey: true, default: () => uuid.v4() },
    apiProvider: {
      type: String,
      required: true,
      validate: value => Object.values(API_PROVIDERS).indexOf(value) !== -1,
    },
    apiKey: { type: String, required: true, trim: true },
    apiSecret: { type: String, required: true, trim: true },
    apiKind: { type: String },
    version: { type: Number, required: true, default: 0 },
  },
  options,
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

secretSchema.statics.deleteWithVersion = async function(key, options) {
  const existingSecret = await this.get({
    userId: key.userId,
    secretId: key.secretId,
  });
  if (existingSecret) {
    const version = existingSecret.version + 1;
    const deletedSecret = await this.delete(
      {
        userId: key.userId,
        secretId: key.secretId,
        version,
      },
      options,
    );
    return deletedSecret;
  } else {
    throw new Error('The Secret delete failed. It was NOT found.');
  }
};

secretSchema.statics.getAll = async function() {
  let results = await this.scan().exec();
  while (results.lastKey) {
    results = await this.scan()
      .startKey(results.startKey)
      .exec();
  }
  return results;
};

const Secret = dynamoose.model('secrets', secretSchema);

module.exports = {
  API_PROVIDERS,
  Secret,
};
