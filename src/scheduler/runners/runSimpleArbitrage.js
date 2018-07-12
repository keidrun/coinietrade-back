const {
  SimpleArbitrageStrategy,
} = require('../strategies/SimpleArbitrageStrategy');
const { Rule } = require('../../models/Rule');
const { decrypt } = require('../../utils/crypto');
const encryptKey = process.env.ENCRYPT_KEY;

const runSimpleArbitrage = async (rule, apiSecrets) => {
  try {
    const userId = rule.userId;
    const ruleId = rule.ruleId;
    const strategy = rule.strategy;
    const argsObj = {
      userId,
      ruleId,
      strategy,
      coinUnit: rule.coinUnit,
      currencyUnit: rule.currencyUnit,
      orderType: rule.orderType,
      assetRange: rule.assetRange,
      assetMinLimit: rule.assetMinLimit,
      buyWeightRate: rule.buyWeightRate,
      sellWeightRate: rule.sellWeightRate,
      a: {
        siteName: rule.oneSiteName,
        apiKey: decrypt(apiSecrets[rule.oneSiteName].apiKey, encryptKey),
        apiSecret: decrypt(apiSecrets[rule.oneSiteName].apiSecret, encryptKey),
      },
      b: {
        siteName: rule.otherSiteName,
        apiKey: decrypt(apiSecrets[rule.otherSiteName].apiKey, encryptKey),
        apiSecret: decrypt(
          apiSecrets[rule.otherSiteName].apiSecret,
          encryptKey,
        ),
      },
    };

    const strategyRunner = new SimpleArbitrageStrategy(argsObj);
    const {
      additionalProfit,
      additionalCounts,
    } = await strategyRunner.doArbitrage();

    const patchRule = {
      totalProfit: rule.totalProfit + additionalProfit,
      counts: {
        executionCount:
          rule.counts.executionCount + additionalCounts.executionCount,
        successCount: rule.counts.successCount + additionalCounts.successCount,
        failureCount: rule.counts.failureCount + additionalCounts.failureCount,
        cancellationCount:
          rule.counts.cancellationCount + additionalCounts.cancellationCount,
      },
    };
    const updatedRule = await Rule.updateWithVersion(
      { userId, ruleId },
      patchRule,
    );

    return updatedRule;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = { runSimpleArbitrage };
