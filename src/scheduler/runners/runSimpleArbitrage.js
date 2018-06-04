const { SimpleArbitrageStrategy } = require('../strategies/SimpleArbitrageStrategy');
const { Rule } = require('../../models/Rule');
const { decrypt } = require('../../utils/crypto');
const encryptKey = process.env.ENCRYPT_KEY;

const runSimpleArbitrage = async (rule, apiSecrets) => {
  try {
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
        apiKey: decrypt(apiSecrets[rule.oneSiteName].apiKey, encryptKey),
        apiSecret: decrypt(apiSecrets[rule.oneSiteName].apiSecret, encryptKey)
      },
      b: {
        siteName: rule.otherSiteName,
        apiKey: decrypt(apiSecrets[rule.otherSiteName].apiKey, encryptKey),
        apiSecret: decrypt(apiSecrets[rule.otherSiteName].apiSecret, encryptKey)
      }
    };

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

      return updatedRule;
    } else {
      throw new Error('Rule Not found');
    }
  } catch (error) {
    throw error;
  }
};

module.exports = { runSimpleArbitrage };
