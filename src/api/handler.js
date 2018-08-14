const policies = require('./v1/policies');
const properties = require('./v1/properties');
const rules = require('./v1/rules');
const secrets = require('./v1/secrets');

// Policies API
module.exports.getPolicies = (event, context, callback) =>
  policies.getPolicies(event, callback);
module.exports.getPolicy = (event, context, callback) =>
  policies.getPolicy(event, callback);
module.exports.addPolicy = (event, context, callback) =>
  policies.addPolicy(event, callback);
module.exports.removePolicy = (event, context, callback) =>
  policies.removePolicy(event, callback);
module.exports.updatePolicy = (event, context, callback) =>
  policies.updatePolicy(event, callback);

// Secrets API
module.exports.addSecret = (event, context, callback) =>
  secrets.addSecret(event, callback);
module.exports.removeSecret = (event, context, callback) =>
  secrets.removeSecret(event, callback);

// Rules API
module.exports.getRules = (event, context, callback) =>
  rules.getRules(event, callback);
module.exports.getRule = (event, context, callback) =>
  rules.getRule(event, callback);
module.exports.getRulesByUserId = (event, context, callback) =>
  rules.getRulesByUserId(event, callback);
module.exports.addRule = (event, context, callback) =>
  rules.addRule(event, callback);
module.exports.removeRule = (event, context, callback) =>
  rules.removeRule(event, callback);
module.exports.updateRule = (event, context, callback) =>
  rules.updateRule(event, callback);

// Properties API
module.exports.getExchanges = (event, context, callback) =>
  properties.getExchanges(event, callback);
