const { getPolicies } = require('./v1/policies/getPolicies');
const { getPolicy } = require('./v1/policies/getPolicy');
const { addPolicy } = require('./v1/policies/addPolicy');
const { removePolicy } = require('./v1/policies/removePolicy');
const { updatePolicy } = require('./v1/policies/updatePolicy');
const { addSecret } = require('./v1/secrets/addSecret');
const { removeSecret } = require('./v1/secrets/removeSecret');
const { addWallet } = require('./v1/wallets/addWallet');
const { removeWallet } = require('./v1/wallets/removeWallet');
const { addRule } = require('./v1/rules/addRule');
const { removeRule } = require('./v1/rules/removeRule');

// Policies API
module.exports.getPolicies = (event, context, callback) => getPolicies(event, callback);
module.exports.getPolicy = (event, context, callback) => getPolicy(event, callback);
module.exports.addPolicy = (event, context, callback) => addPolicy(event, callback);
module.exports.removePolicy = (event, context, callback) => removePolicy(event, callback);
module.exports.updatePolicy = (event, context, callback) => updatePolicy(event, callback);

// Secrets API
module.exports.addSecret = (event, context, callback) => addSecret(event, callback);
module.exports.removeSecret = (event, context, callback) => removeSecret(event, callback);

// Wallets API
module.exports.addWallet = (event, context, callback) => addWallet(event, callback);
module.exports.removeWallet = (event, context, callback) => removeWallet(event, callback);

// Rules API
module.exports.addRule = (event, context, callback) => addRule(event, callback);
module.exports.removeRule = (event, context, callback) => removeRule(event, callback);
