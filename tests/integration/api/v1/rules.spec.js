const uuid = require('uuid');
const axios = require('../../../helpers/axios');
require('../../../helpers/configYamlUtils').loadConfigYamlToEnv(
  process.env.NODE_ENV,
);
const { Rule, RULE_STATUS } = require('../../../../src/models/Rule');
const { sortByCreatedAt } = require('../../../helpers/testUtils');

beforeAll(() => {
  // Clear all Rules items
  return Rule.getAll().then(existingRules => {
    return existingRules.forEach(rule => {
      return Rule.delete({ userId: rule.userId, ruleId: rule.ruleId });
    });
  });
});

afterAll(() => {
  // Clear all Rules items
  return Rule.getAll().then(existingRules => {
    return existingRules.forEach(rule => {
      return Rule.delete({ userId: rule.userId, ruleId: rule.ruleId });
    });
  });
});

describe('rules endpoints', () => {
  const existingRules = [];
  const groupUserId = uuid.v4();

  describe('POST /v1/rules', () => {
    test('should fetch added data with all arguments pattern1', async () => {
      const response = await axios.post(`/v1/rules`, {
        userId: groupUserId,
        priority: 1,
        strategy: 'simple_arbitrage',
        coinUnit: 'btc',
        currencyUnit: 'jpy',
        orderType: 'limit_order',
        assetRange: 0.1,
        assetMinLimit: 2000,
        buyWeightRate: 1.001,
        sellWeightRate: 0.999,
        maxFailedLimit: 999,
        oneSiteName: 'bitflyer',
        otherSiteName: 'zaif',
      });

      expect(response.data.priority).toBe(1);
      expect(response.data.strategy).toBe('simple_arbitrage');
      expect(response.data.coinUnit).toBe('btc');
      expect(response.data.currencyUnit).toBe('jpy');
      expect(response.data.orderType).toBe('limit_order');
      expect(response.data.assetRange).toBe(0.1);
      expect(response.data.assetMinLimit).toBe(2000);
      expect(response.data.buyWeightRate).toBe(1.001);
      expect(response.data.sellWeightRate).toBe(0.999);
      expect(response.data.maxFailedLimit).toBe(999);
      expect(response.data.oneSiteName).toBe('bitflyer');
      expect(response.data.otherSiteName).toBe('zaif');
      expect(response.data.status).toBe('available');
      existingRules.push(response.data);
    });

    test('should fetch added data with all arguments pattern2', async () => {
      const response = await axios.post(`/v1/rules`, {
        userId: groupUserId,
        priority: 2,
        strategy: 'simple_arbitrage',
        coinUnit: 'btc',
        currencyUnit: 'jpy',
        orderType: 'market_order',
        assetRange: 1.0,
        assetMinLimit: 3500,
        buyWeightRate: 1.001,
        sellWeightRate: 0.999,
        maxFailedLimit: 777,
        oneSiteName: 'bitflyer',
        otherSiteName: 'zaif',
      });

      expect(response.data.priority).toBe(2);
      expect(response.data.strategy).toBe('simple_arbitrage');
      expect(response.data.coinUnit).toBe('btc');
      expect(response.data.currencyUnit).toBe('jpy');
      expect(response.data.orderType).toBe('market_order');
      expect(response.data.assetRange).toBe(1.0);
      expect(response.data.assetMinLimit).toBe(3500);
      expect(response.data.buyWeightRate).toBe(1.001);
      expect(response.data.sellWeightRate).toBe(0.999);
      expect(response.data.maxFailedLimit).toBe(777);
      expect(response.data.oneSiteName).toBe('bitflyer');
      expect(response.data.otherSiteName).toBe('zaif');
      expect(response.data.status).toBe('available');
      existingRules.push(response.data);
    });

    test('should fetech added data without option arguments', async () => {
      const response = await axios.post(`/v1/rules`, {
        userId: uuid.v4(),
        strategy: 'simple_arbitrage',
        coinUnit: 'btc',
        currencyUnit: 'jpy',
        oneSiteName: 'zaif',
        otherSiteName: 'bitflyer',
      });

      expect(response.data.priority).toBe(0);
      expect(response.data.strategy).toBe('simple_arbitrage');
      expect(response.data.coinUnit).toBe('btc');
      expect(response.data.currencyUnit).toBe('jpy');
      expect(response.data.orderType).toBe('limit_order');
      expect(response.data.oneSiteName).toBe('zaif');
      expect(response.data.otherSiteName).toBe('bitflyer');
      expect(response.data.counts).toEqual({
        executionCount: 0,
        successCount: 0,
        failureCount: 0,
        cancellationCount: 0,
      });
      existingRules.push(response.data);
    });
  });

  describe('GET /v1/rules', () => {
    test('should fetch all data', async () => {
      const response = await axios.get(`/v1/rules`);

      const rules = response.data;
      sortByCreatedAt(rules);

      expect(rules).toHaveLength(3);
      rules.forEach((rule, i) => {
        expect(rule).toEqual({
          userId: existingRules[i].userId,
          ruleId: existingRules[i].ruleId,
          priority: existingRules[i].priority,
          strategy: existingRules[i].strategy,
          coinUnit: existingRules[i].coinUnit,
          currencyUnit: existingRules[i].currencyUnit,
          orderType: existingRules[i].orderType,
          assetRange: existingRules[i].assetRange,
          assetMinLimit: existingRules[i].assetMinLimit,
          buyWeightRate: existingRules[i].buyWeightRate,
          sellWeightRate: existingRules[i].sellWeightRate,
          maxFailedLimit: existingRules[i].maxFailedLimit,
          oneSiteName: existingRules[i].oneSiteName,
          otherSiteName: existingRules[i].otherSiteName,
          totalProfit: existingRules[i].totalProfit,
          counts: existingRules[i].counts,
          status: existingRules[i].status,
          modifiedAt: existingRules[i].modifiedAt,
          version: existingRules[i].version,
          createdAt: existingRules[i].createdAt,
          updatedAt: existingRules[i].updatedAt,
        });
      });
    });
  });

  describe('GET /v1/rules/{userId}', () => {
    test('should fetch the data with the same userId', async () => {
      const response = await axios.get(`/v1/rules/${groupUserId}`);

      const rules = response.data;
      sortByCreatedAt(rules);

      expect(rules).toHaveLength(2);
      rules.forEach((rule, i) => {
        expect(rule).toEqual({
          userId: existingRules[i].userId,
          ruleId: existingRules[i].ruleId,
          priority: existingRules[i].priority,
          strategy: existingRules[i].strategy,
          coinUnit: existingRules[i].coinUnit,
          currencyUnit: existingRules[i].currencyUnit,
          orderType: existingRules[i].orderType,
          assetRange: existingRules[i].assetRange,
          assetMinLimit: existingRules[i].assetMinLimit,
          buyWeightRate: existingRules[i].buyWeightRate,
          sellWeightRate: existingRules[i].sellWeightRate,
          maxFailedLimit: existingRules[i].maxFailedLimit,
          oneSiteName: existingRules[i].oneSiteName,
          otherSiteName: existingRules[i].otherSiteName,
          totalProfit: existingRules[i].totalProfit,
          counts: existingRules[i].counts,
          status: existingRules[i].status,
          modifiedAt: existingRules[i].modifiedAt,
          version: existingRules[i].version,
          createdAt: existingRules[i].createdAt,
          updatedAt: existingRules[i].updatedAt,
        });
      });
    });

    test('should fetch 404 status when any data NOT exit', async () => {
      const userId = 'none';
      try {
        await axios.get(`/v1/rules/${userId}`);
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('DELETE /v1/rules/{userId}/{ruleId}', () => {
    test('should fetch 204 status', async () => {
      const expectedToDeleteRule = existingRules[existingRules.length - 1];
      const response = await axios.delete(
        `/v1/rules/${expectedToDeleteRule.userId}/${
          expectedToDeleteRule.ruleId
        }`,
      );

      expect(response.status).toBe(204);
      expect(response.data).toBe('');

      const deletedRule = await Rule.get({
        userId: expectedToDeleteRule.userId,
        ruleId: expectedToDeleteRule.ruleId,
      });

      expect(deletedRule.userId).toBe(expectedToDeleteRule.userId);
      expect(deletedRule.ruleId).toBe(expectedToDeleteRule.ruleId);
      expect(deletedRule.status).toBe(RULE_STATUS.DELETED);

      existingRules.pop();
      existingRules.push(deletedRule);
    });

    test('should fetch 404 status when any data NOT exit', async () => {
      const userId = 'none';
      const ruleId = 'none';
      try {
        await axios.delete(`/v1/rules/${userId}/${ruleId}`);
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});
