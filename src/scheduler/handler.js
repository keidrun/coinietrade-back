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
          console.warn(util.format('WARN : %s', 'Policy NOT Found, SKIPPING process...'));
          return;
        }
        const effect = policy.effect;
        const mExpiredAt = moment(policy.expiredAt).utc();
        const mNow = moment().utc();
        if (effect === USER_EFFECTS.ALLOW && mNow.isBefore(mExpiredAt)) {
          const secrets = await Secret.query('userId').eq(userId).exec();
          const oneSecret = secrets.filter((secret) => secret.apiProvider === oneSiteName)[0];
          const otherSecret = secrets.filter((secret) => secret.apiProvider === otherSiteName)[0];

          // If exist key and secret of both exchange sites
          if (!oneSecret || !otherSecret) {
            console.warn(util.format('WARN : %s', 'Secrets MUST have over 2  effective items, SKIPPING process...'));
            return;
          }

          // If change the rule's status to unavailable
          if (rule.counts.failureCount >= rule.maxFailedLimit) {
            await Rule.updateWithVersion(
              { userId: rule.userId, ruleId: rule.ruleId },
              { status: RULE_STATUS.UNAVAILABLE }
            );
            console.warn(
              util.format(
                'WARN : %s',
                "Over failure count, then the rule's status was changed to unavailable, SKIPPING process..."
              )
            );
            return;
          }

          const apiSecrets = {};
          apiSecrets[oneSiteName] = oneSecret;
          apiSecrets[otherSiteName] = otherSecret;

          console.info(util.format('INFO : %s', 'Applying a rule...'));
          let updatedRule;
          switch (arbitrageStrategy) {
            case ARBITRAGE_STRATEGIES.SIMPLE:
              updatedRule = await runSimpleArbitrage(rule, apiSecrets);
              break;
            default:
              updatedRule = await runSimpleArbitrage(rule, apiSecrets);
              break;
          }
          console.info(util.format('INFO : %s', 'Applied  a rule'));
          console.log(updatedRule);
        }
      } catch (error) {
        // Rule table update error
        console.error(util.format('ERROR : %s', error));
      }
    });
  } catch (error) {
    // database connection error OR bugs
    console.error(util.format('ERROR : %s', error));
  }
};
