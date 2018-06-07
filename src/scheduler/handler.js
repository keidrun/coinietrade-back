const util = require('util');
const moment = require('moment');
const { Rule, RULE_STATUS, ARBITRAGE_STRATEGIES } = require('../models/Rule');
const { Policy, USER_EFFECTS } = require('../models/Policy');
const { Secret } = require('../models/Secret');
const { runSimpleArbitrage } = require('./runners/runSimpleArbitrage');

const rulesConcurrentExecutionLimit = process.env.SCHEDULER_RULES_CONCURRENT_EXECUTION_LIMIT;

/* eslint-disable no-unused-vars */
module.exports.scheduleArbitrage = async (event, context, callback) => {
  /* eslint-enable no-unused-vars */

  console.info(util.format('INFO : %s', 'Starting Arbitrage...'));
  try {
    const availableRules = await Rule.query('status')
      .eq(RULE_STATUS.AVAILABLE)
      .ascending() //sorted by modifiedAt
      .limit(rulesConcurrentExecutionLimit)
      .exec();

    if (availableRules.count <= 0) {
      console.warn(util.format('WARN : %s', 'Available Rules NOT Found, SKIPPING process...'));
      return;
    }

    // AVAILABLE -> LOCKED
    const lockedRules = await Promise.all(
      availableRules.map(async (rule) => {
        return await Rule.updateWithVersion(
          { userId: rule.userId, ruleId: rule.ruleId },
          { status: RULE_STATUS.LOCKED }
        );
      })
    );

    // handle rules
    await Promise.all(
      lockedRules.map(async (rule) => {
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

          // Skip process if NOT exist key and secret of both exchange sites
          if (!oneSecret || !otherSecret) {
            console.warn(util.format('WARN : %s', 'Secrets MUST have over 2  effective items, SKIPPING process...'));
            return;
          }

          // Change to UNAVAILABLE when exceeds max failed limit
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
      })
    );

    //  LOCKED -> AVAILABLE
    await Promise.all(
      lockedRules.map(async (rule) => {
        return await Rule.updateWithVersion(
          { userId: rule.userId, ruleId: rule.ruleId },
          { status: RULE_STATUS.AVAILABLE }
        );
      })
    );
  } catch (error) {
    // database connection error OR inconsistent data OR bugs
    console.error(util.format('ERROR : %s', error));
  }
};
