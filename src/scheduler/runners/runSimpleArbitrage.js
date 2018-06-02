const { SimpleArbitrageStrategy } = require('../strategies/SimpleArbitrageStrategy');
const { Rule } = require('../../models/Rule');

const runSimpleArbitrage = async (rule, apiSecrets) => {
  const userId = rule.userId;
  const ruleId = rule.ruleId;
  const arbitrageStrategy = rule.arbitrageStrategy;

  const argsObj = {
    userId,
    ruleId,
    arbitrageStrategy,
    coinUnit: rule.coinUnit,
    currencyUnit: rule.currencyUnit,
    orderType: rule.orderType,
    assetRange: rule.assetRange,
    commitmentTimeLimit: rule.commitmentTimeLimit,
    buyWeightRate: rule.buyWeightRate,
    sellWeightRate: rule.sellWeightRate,
    a: {
      siteName: rule.oneSiteName,
      apiKey: apiSecrets[rule.oneSiteName].apiKey,
      apiSecret: apiSecrets[rule.oneSiteName].apiSecret
    },
    b: {
      siteName: rule.otherSiteName,
      apiKey: apiSecrets[rule.otherSiteName].apiKey,
      apiSecret: apiSecrets[rule.otherSiteName].apiSecret
    }
  };

  try {
    const strategy = new SimpleArbitrageStrategy(argsObj);
    const { additionalProfit, additionalCounts } = await strategy.doArbitrage();

    const existingRule = await Rule.get({ userId, ruleId });
    if (existingRule) {
      const version = existingRule.version + 1;
      const patchRule = {
        totalProfit: rule.totalProfit + additionalProfit,
        counts: {
          executionCount: rule.counts.executionCount + additionalCounts.executionCount,
          successCount: rule.counts.successCount + additionalCounts.successCount,
          failureCount: rule.counts.failureCount + additionalCounts.failureCount,
          cancellationCount: rule.counts.cancellationCount + additionalCounts.cancellationCount
        },
        version
      };
      const updatedRule = await Rule.update({ userId, ruleId, version }, { $PUT: patchRule });

      console.log(updatedRule);
    } else {
      throw new Error('Rule table update failed');
    }
  } catch (error) {
    throw error;
  }
};

module.exports = { runSimpleArbitrage };
