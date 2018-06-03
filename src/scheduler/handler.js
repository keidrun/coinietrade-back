const util = require('util');
const moment = require('moment');
const { Rule, RULE_STATUS, ARBITRAGE_STRATEGIES } = require('../models/Rule');
const { Policy, USER_EFFECTS } = require('../models/Policy');
const { Secret } = require('../models/Secret');
const { runSimpleArbitrage } = require('./runners/runSimpleArbitrage');

/* eslint-disable no-unused-vars */
module.exports.scheduleArbitrage = async (event, context, callback) => {
  /* eslint-enable no-unused-vars */

  console.info(util.format('INFO : %s', 'Starting Arbitrage...'));
  try {
    const availableRules = await Rule.query('status').eq(RULE_STATUS.AVAILABLE).exec();
    availableRules.sort((a, b) => {
      if (a.priority > b.priority) return -1;
      if (a.priority < b.priority) return 1;
      return 0;
    });
    availableRules.forEach(async (rule) => {
      try {
        const userId = rule.userId;
        const arbitrageStrategy = rule.arbitrageStrategy;
        const oneSiteName = rule.oneSiteName;
        const otherSiteName = rule.otherSiteName;

        const policy = await Policy.get(userId);
        if (!policy) {
          console.info(util.format('WARN : %s', 'Policy NOT Found, SKIPPING process...'));
          return;
        }
        const effect = policy.effect;
        const mExpiredAt = moment(policy.expiredAt).utc();
        const mNow = moment().utc();
        if (effect === USER_EFFECTS.ALLOW && mNow.isBefore(mExpiredAt)) {
          const secrets = await Secret.query('userId').eq(userId).exec();
          if (secrets.length < 2) {
            console.info(util.format('WARN : %s', 'Secrets MUST have over 2 items, SKIPPING process...'));
            return;
          }
          const oneSecret = secrets.filter((secret) => secret.apiProvider === oneSiteName)[0];
          const otherSecret = secrets.filter((secret) => secret.apiProvider === otherSiteName)[0];
          const apiSecrets = {};
          apiSecrets[oneSiteName] = oneSecret;
          apiSecrets[otherSiteName] = otherSecret;

          console.info(util.format('INFO : %s', 'Applying a rule...'));
          switch (arbitrageStrategy) {
            case ARBITRAGE_STRATEGIES.SIMPLE:
              await runSimpleArbitrage(rule, apiSecrets);
              break;
            default:
              await runSimpleArbitrage(rule, apiSecrets);
              break;
          }
          console.info(util.format('INFO : %s', 'Applied  a rule'));
        }
      } catch (error) {
        // Rule table update error etc.
        console.error(util.format('ERROR : %s', error));
      }
    });
    console.log('###');
  } catch (error) {
    // database connection error
    console.error(util.format('ERROR : %s', error));
  }
};
