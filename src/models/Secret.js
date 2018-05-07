const uuid = require('uuid');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;

const apiNameList = ['bitflyer', 'zaif'];

const options = {
  timestamps: true
};

const secretSchema = new Schema(
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
    apiName: {
      type: String,
      required: true,
      validate: value => apiNameList.indexOf(value) !== -1
    },
    apiKey: {
      type: String,
      required: true,
      trim: true
    },
    apiSecret: {
      type: String,
      required: true,
      trim: true
    }
  },
  options
);

const Secret = dynamoose.model('secrets', secretSchema);

module.exports = {
  Secret
};
