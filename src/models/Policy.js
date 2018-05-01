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
      hashKey: true
    },
    effect: {
      type: String,
      required: true,
      default: EFFECTS.ALLOW
    }
  },
  options
);

const Policy = dynamoose.model('policies', policySchema);

module.exports = {
  Policy,
  EFFECTS
};
