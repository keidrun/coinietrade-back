const uuid = require('uuid');
const moment = require('moment');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;

const EFFECTS = {
  ALLOW: 'allow',
  DENY: 'deny'
};

const USER_GRADES = {
  FREE: 'free',
  PRO: 'professional',
  ULTIMATE: 'ultimate'
};

const options = {
  timestamps: true,
  useNativeBooleans: true,
  useDocumentTypes: true
};

const policySchema = new Schema(
  {
    id: { type: String, hashKey: true, default: () => uuid.v4() },
    userId: { type: String, required: true, trim: true },
    effect: {
      type: String,
      required: true,
      default: EFFECTS.ALLOW,
      validate: (value) => Object.values(EFFECTS).indexOf(value) !== -1
    },
    grade: {
      type: String,
      required: true,
      default: USER_GRADES.FREE,
      validate: (value) => Object.values(USER_GRADES).indexOf(value) !== -1
    },
    ruleLimit: { type: Number, required: true, default: 1 },
    expiredAt: {
      type: Date,
      required: true,
      default: () => moment().add(1, 'month').toISOString()
    },
    version: { type: Number, required: true, default: 0 }
  },
  options
);

policySchema.statics.getAll = async function() {
  let results = await this.scan().exec();
  while (results.lastKey) {
    results = await this.scan().startKey(results.startKey).exec();
  }
  return results;
};

const Policy = dynamoose.model('policies', policySchema);

module.exports = {
  EFFECTS,
  USER_GRADES,
  Policy
};
