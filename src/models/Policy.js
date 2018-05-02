const uuid = require('uuid');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;

const EFFECTS = {
  ALLOW: 'allow',
  DENY: 'deny',
  CANCELED: 'canceled'
};

const options = {
  timestamps: true
};

const policySchema = new Schema(
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
    effect: {
      type: String,
      required: true,
      default: EFFECTS.ALLOW,
      validate: value =>
        [EFFECTS.ALLOW, EFFECTS.DENY, EFFECTS.CANCELED].indexOf(value) !== -1
    }
  },
  options
);

const Policy = dynamoose.model('policies', policySchema);

module.exports = {
  Policy,
  EFFECTS
};
