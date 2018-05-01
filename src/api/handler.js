const { getPolicies } = require('./v1/policies/getPolicies');
const { getPolicy } = require('./v1/policies/getPolicy');
const { addPolicy } = require('./v1/policies/addPolicy');
const { removePolicy } = require('./v1/policies/removePolicy');
const { updatePolicy } = require('./v1/policies/updatePolicy');

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
