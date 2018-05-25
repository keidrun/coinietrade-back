const uuid = require('uuid');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;

const EFFECTS = {
  ALLOW: 'allow',
  DENY: 'deny',
  CANCELED: 'canceled',
  ERRORED: 'errored'
};
const effectList = Object.values(EFFECTS);
const USER_GRADES = {
  FREE: 'free',
  PRO: 'professional',
  ULTIMATE: 'ultimate'
};
const userGradeList = Object.values(USER_GRADES);

const options = {
  timestamps: true,
  useNativeBooleans: true,
  useDocumentTypes: true
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
      validate: (value) => effectList.indexOf(value) !== -1
    },
    grade: {
      type: String,
      required: true,
      default: USER_GRADES.FREE,
      validate: (value) => userGradeList.indexOf(value) !== -1
    },
    ruleLimit: {
      type: Number,
      required: true,
      default: 1
    }
  },
  options
);

const Policy = dynamoose.model('policies', policySchema);

module.exports = {
  EFFECTS,
  USER_GRADES,
  Policy
};
