const uuid = require('uuid');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;
const { encrypt, decrypt } = require('../utils/crypto');

const companyList = [ 'bitflyer', 'zaif' ];
const addressTypeList = [ 'btc' ];

const options = {
  timestamps: true
};

const walletSchema = new Schema(
  {
    id: {
      type: String,
      hashKey: true,
      default: () => uuid.v4()
    },
    userId: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      required: true,
      validate: (value) => companyList.indexOf(value) !== -1
    },
    addressType: {
      type: String,
      required: true,
      validate: (value) => addressTypeList.indexOf(value) !== -1
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    version: {
      type: Number,
      required: true,
      default: 0
    }
  },
  options
);

walletSchema.methods.encryptAndSave = function(encryptKey, options) {
  this.address = encrypt(this.address, encryptKey);
  return this.save(options);
};

walletSchema.statics.getAndDecrypt = async function(id, encryptKey) {
  try {
    const wallet = await this.get(id);
    wallet.address = decrypt(wallet.address, encryptKey);
    return wallet;
  } catch (error) {
    return error;
  }
};

walletSchema.statics.getAll = function() {
  return this.scan().exec();
};

const Wallet = dynamoose.model('walllets', walletSchema);

module.exports = { Wallet };
