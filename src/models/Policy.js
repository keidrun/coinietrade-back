const moment = require('moment');
const dynamoose = require('../services/dynamoose');
const { Schema } = dynamoose;

const USER_EFFECTS = {
  ALLOW: 'allow',
  DENY: 'deny',
};

const USER_GRADES = {
  FREE: 0,
  PRO: 1,
  ULTIMATE: 2,
};

const DEFAULT_RULE_NUM = 3;

const options = {
  timestamps: true,
  useNativeBooleans: true,
  useDocumentTypes: true,
};

const policySchema = new Schema(
  {
    userId: { type: String, hashKey: true, required: true, trim: true },
    effect: {
      type: String,
      required: true,
      default: USER_EFFECTS.ALLOW,
      validate: value => Object.values(USER_EFFECTS).indexOf(value) !== -1,
    },
    grade: {
      type: Number,
      required: true,
      default: USER_GRADES.FREE,
      validate: value => Object.values(USER_GRADES).indexOf(value) !== -1,
    },
    ruleLimit: { type: Number, required: true, default: DEFAULT_RULE_NUM },
    expiredAt: {
      type: Date,
      required: true,
      default: () =>
        moment()
          .add(1, 'month')
          .toISOString(),
    },
    version: { type: Number, required: true, default: 0 },
  },
  options,
);

policySchema.statics.updateWithVersion = async function(key, update, options) {
  const existingPolicy = await this.get({
    userId: key.userId,
  });
  if (existingPolicy) {
    const version = existingPolicy.version + 1;
    update.version = version;
    const updatedPolicy = await this.update(
      {
        userId: key.userId,
        version,
      },
      {
        $PUT: update,
      },
      options,
    );
    return updatedPolicy;
  } else {
    throw new Error('The Policy update failed. It was NOT found.');
  }
};

policySchema.statics.deleteWithVersion = async function(key, options) {
  const existingPolicy = await this.get({
    userId: key.userId,
  });
  if (existingPolicy) {
    const version = existingPolicy.version + 1;
    const deletedPolicy = await this.delete(
      {
        userId: key.userId,
        version,
      },
      options,
    );
    return deletedPolicy;
  } else {
    throw new Error('The Policy delete failed. It was NOT found.');
  }
};

policySchema.statics.getAll = async function() {
  let results = await this.scan().exec();
  while (results.lastKey) {
    results = await this.scan()
      .startKey(results.startKey)
      .exec();
  }
  return results;
};

const Policy = dynamoose.model('policies', policySchema);

module.exports = {
  USER_EFFECTS,
  USER_GRADES,
  Policy,
};
