const path = require('path');
const { createLog } = require('../utils/logger');
const moment = require('moment');
const { Rule, RULE_STATUS, STRATEGIES } = require('../models/Rule');
const { Policy, USER_EFFECTS } = require('../models/Policy');
const { Secret } = require('../models/Secret');
const { runSimpleArbitrage } = require('./runners/runSimpleArbitrage');

const logger = createLog('scheduler', path.basename(__filename));

const rulesConcurrentExecutionLimit =
  process.env.SCHEDULER_RULES_CONCURRENT_EXECUTION_LIMIT;

/* eslint-disable no-unused-vars */
module.exports.scheduleArbitrage = async (event, context, callback) => {
  /* eslint-enable no-unused-vars */

  logger.info('Starting Arbitrage...');
  try {
    const availableRules = await Rule.query('status')
      .eq(RULE_STATUS.AVAILABLE)
      .ascending() //sorted by modifiedAt
      .limit(rulesConcurrentExecutionLimit)
      .exec();
    logger.debug('Available rules =>');
    logger.debug(availableRules);

    if (availableRules.count <= 0) {
      logger.warn('Available rules NOT found. Skipping process...');
      return;
    }

    // AVAILABLE -> LOCKED
    const lockedRules = await Promise.all(
      availableRules.map(async rule => {
        return await Rule.updateWithVersion(
          { userId: rule.userId, ruleId: rule.ruleId },
          { status: RULE_STATUS.LOCKED },
        );
      }),
    );
    logger.debug('locked rules  =>');
    logger.debug(lockedRules);

    // handle rules
    logger.info('Applying rules...');
    const updatedRules = await Promise.all(
      lockedRules.map(async rule => {
        const userId = rule.userId;
        const strategy = rule.strategy;
        const oneSiteName = rule.oneSiteName;
        const otherSiteName = rule.otherSiteName;

        const policy = await Policy.get(userId);
        if (!policy) {
          logger.warn('Policy NOT found. Skipping process...');
          return;
        }

        const effect = policy.effect;
        const mExpiredAt = moment(policy.expiredAt).utc();
        const mNow = moment().utc();
        if (effect === USER_EFFECTS.ALLOW && mNow.isBefore(mExpiredAt)) {
          const secrets = await Secret.query('userId')
            .eq(userId)
            .exec();
          const oneSecret = secrets.filter(
            secret => secret.apiProvider === oneSiteName,
          )[0];
          const otherSecret = secrets.filter(
            secret => secret.apiProvider === otherSiteName,
          )[0];

          // Skip process if NOT exist key and secret of both exchange sites
          if (!oneSecret || !otherSecret) {
            logger.warn(
              'Secrets MUST have pair effective items. Skipping process...',
            );
            return;
          }

          // Change to UNAVAILABLE when exceeds max failed limit
          if (rule.counts.failureCount >= rule.maxFailedLimit) {
            await Rule.updateWithVersion(
              { userId: rule.userId, ruleId: rule.ruleId },
              { status: RULE_STATUS.UNAVAILABLE },
            );
            logger.warn(
              "Exceeded failure count, then the rule's status was changed to unavailable. Skipping process...",
            );
            return;
          }

          const apiSecrets = {};
          apiSecrets[oneSiteName] = oneSecret;
          apiSecrets[otherSiteName] = otherSecret;

          let updatedRule;
          switch (strategy) {
            case STRATEGIES.SIMPLE_ARBITRAGE:
              updatedRule = await runSimpleArbitrage(rule, apiSecrets);
              break;
            default:
              updatedRule = await runSimpleArbitrage(rule, apiSecrets);
              break;
          }
          return updatedRule;
        }
      }),
    );

    logger.info('Applied rules.');
    logger.debug('Applied rules =>');
    logger.debug(updatedRules);

    // LOCKED -> AVAILABLE
    const releasedRukes = await Promise.all(
      lockedRules.map(async rule => {
        return await Rule.updateWithVersion(
          { userId: rule.userId, ruleId: rule.ruleId },
          { status: RULE_STATUS.AVAILABLE },
        );
      }),
    );
    logger.debug('Released rules =>');
    logger.debug(releasedRukes);
  } catch (error) {
    // database connection error OR inconsistent data OR bugs
    logger.fatal(new Error(error));
  }
};
