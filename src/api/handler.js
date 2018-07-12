const { getPolicies } = require('./v1/policies/getPolicies');
const { getPolicy } = require('./v1/policies/getPolicy');
const { addPolicy } = require('./v1/policies/addPolicy');
const { removePolicy } = require('./v1/policies/removePolicy');
const { updatePolicy } = require('./v1/policies/updatePolicy');
const { addSecret } = require('./v1/secrets/addSecret');
const { removeSecret } = require('./v1/secrets/removeSecret');
const { getRules } = require('./v1/rules/getRules');
const { getRulesByUserId } = require('./v1/rules/getRulesByUserId');
const { addRule } = require('./v1/rules/addRule');
const { removeRule } = require('./v1/rules/removeRule');
const { getExchanges } = require('./v1/properties/getExchanges');

// Policies API
module.exports.getPolicies = (event, context, callback) =>
  getPolicies(event, callback);
module.exports.getPolicy = (event, context, callback) =>
  getPolicy(event, callback);
module.exports.addPolicy = (event, context, callback) =>
  addPolicy(event, callback);
module.exports.removePolicy = (event, context, callback) =>
  removePolicy(event, callback);
module.exports.updatePolicy = (event, context, callback) =>
  updatePolicy(event, callback);

// Secrets API
module.exports.addSecret = (event, context, callback) =>
  addSecret(event, callback);
module.exports.removeSecret = (event, context, callback) =>
  removeSecret(event, callback);

// Rules API
module.exports.getRules = (event, context, callback) =>
  getRules(event, callback);
module.exports.getRulesByUserId = (event, context, callback) =>
  getRulesByUserId(event, callback);
module.exports.addRule = (event, context, callback) => addRule(event, callback);
module.exports.removeRule = (event, context, callback) =>
  removeRule(event, callback);

// Properties API
module.exports.getExchanges = (event, context, callback) =>
  getExchanges(event, callback);
