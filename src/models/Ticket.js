const uuid = require('uuid');
const moment = require('moment');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;

const options = {
  timestamps: true,
  useNativeBooleans: true,
  useDocumentTypes: true
};

const ticketSchema = new Schema(
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
    times: {
      type: Number,
      required: true,
      default: 0
    },
    expiredAt: {
      type: Number,
      required: true,
      default: () => moment().add(1, 'year').format('x') // One year later and Unix timestamp of 13 digits format
    }
  },
  options
);

const Ticket = dynamoose.model('tickets', ticketSchema);

module.exports = { Ticket };
