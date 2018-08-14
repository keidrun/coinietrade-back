const uuid = require('uuid');
const { configYamlUtils, axios, testUtils } = require('../../../helpers');
configYamlUtils.loadConfigYamlToEnv(process.env.NODE_ENV);
const { sortByCreatedAt } = testUtils;
const {
  Rule,
  STRATEGIES,
  ORDER_TYPES,
  COIN_UNITS,
  CURRENCY_UNITS,
  EXCHANGE_SITES,
  RULE_STATUS,
} = require('../../../../src/models');

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

  describe('GET /v1/rules/{userId}/{ruleId}', () => {
    test('should fetch a rule', async () => {
      const existingRule = existingRules[0];
      const ruleId = existingRule.ruleId;
      const response = await axios.get(`/v1/rules/${groupUserId}/${ruleId}`);

      expect(response.status).toBe(200);
      expect(response.data).toEqual(existingRule);
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

  describe('PATCH /v1/rules/{userId}/{ruleId}', () => {
    test('should fetch updated all data', async () => {
      const expectedToUpdateRule = existingRules[0];

      const response = await axios.patch(
        `/v1/rules/${expectedToUpdateRule.userId}/${
          expectedToUpdateRule.ruleId
        }`,
        {
          priority: 123,
          strategy: STRATEGIES.SIMPLE_ARBITRAGE,
          coinUnit: COIN_UNITS.BTC,
          currencyUnit: CURRENCY_UNITS.JPY,
          orderType: ORDER_TYPES.LIMIT_ORDER,
          assetRange: 0.123,
          assetMinLimit: 12345,
          buyWeightRate: 1.00123,
          sellWeightRate: 0.99877,
          maxFailedLimit: 123,
          oneSiteName: EXCHANGE_SITES.ZAIF,
          otherSiteName: EXCHANGE_SITES.BITFLYER,
          totalProfit: 123,
          counts: {
            executionCount: 1,
            successCount: 2,
            failureCount: 3,
            cancellationCount: 4,
          },
          status: RULE_STATUS.UNAVAILABLE,
        },
      );

      const updatedRule = response.data;
      expectedToUpdateRule.priority = 123;
      expectedToUpdateRule.strategy = STRATEGIES.SIMPLE_ARBITRAGE;
      expectedToUpdateRule.coinUnit = COIN_UNITS.BTC;
      expectedToUpdateRule.currencyUnit = CURRENCY_UNITS.JPY;
      expectedToUpdateRule.orderType = ORDER_TYPES.LIMIT_ORDER;
      expectedToUpdateRule.assetRange = 0.123;
      expectedToUpdateRule.assetMinLimit = 12345;
      expectedToUpdateRule.buyWeightRate = 1.00123;
      expectedToUpdateRule.sellWeightRate = 0.99877;
      expectedToUpdateRule.maxFailedLimit = 123;
      expectedToUpdateRule.oneSiteName = EXCHANGE_SITES.ZAIF;
      expectedToUpdateRule.otherSiteName = EXCHANGE_SITES.BITFLYER;
      expectedToUpdateRule.totalProfit = 123;
      expectedToUpdateRule.counts = {
        executionCount: 1,
        successCount: 2,
        failureCount: 3,
        cancellationCount: 4,
      };
      expectedToUpdateRule.status = RULE_STATUS.UNAVAILABLE;
      expectedToUpdateRule.version = expectedToUpdateRule.version + 1;

      expect(updatedRule.userId).toBe(expectedToUpdateRule.userId);
      expect(updatedRule.ruleId).toBe(expectedToUpdateRule.ruleId);
      expect(updatedRule.priority).toBe(expectedToUpdateRule.priority);
      expect(updatedRule.strategy).toBe(expectedToUpdateRule.strategy);
      expect(updatedRule.coinUnit).toBe(expectedToUpdateRule.coinUnit);
      expect(updatedRule.currencyUnit).toBe(expectedToUpdateRule.currencyUnit);
      expect(updatedRule.orderType).toBe(expectedToUpdateRule.orderType);
      expect(updatedRule.assetRange).toBe(expectedToUpdateRule.assetRange);
      expect(updatedRule.assetMinLimit).toBe(
        expectedToUpdateRule.assetMinLimit,
      );
      expect(updatedRule.buyWeightRate).toBe(
        expectedToUpdateRule.buyWeightRate,
      );
      expect(updatedRule.sellWeightRate).toBe(
        expectedToUpdateRule.sellWeightRate,
      );
      expect(updatedRule.maxFailedLimit).toBe(
        expectedToUpdateRule.maxFailedLimit,
      );
      expect(updatedRule.oneSiteName).toBe(expectedToUpdateRule.oneSiteName);
      expect(updatedRule.otherSiteName).toBe(
        expectedToUpdateRule.otherSiteName,
      );
      expect(updatedRule.totalProfit).toBe(expectedToUpdateRule.totalProfit);
      expect(updatedRule.counts).toEqual(expectedToUpdateRule.counts);
      expect(updatedRule.status).toBe(expectedToUpdateRule.status);
      expect(updatedRule.version).toBe(expectedToUpdateRule.version);

      existingRules[0] = expectedToUpdateRule;
    });

    test('should fetch 400 status because of counts validation error', async () => {
      const expectedToUpdateRule = existingRules[0];

      try {
        await axios.patch(
          `/v1/rules/${expectedToUpdateRule.userId}/${
            expectedToUpdateRule.ruleId
          }`,
          {
            counts: {},
          },
        );
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.errors).toHaveLength(4);
      }
    });

    test('should fetch 404 status when any data NOT exit', async () => {
      const userId = 'none';
      const ruleId = 'none';
      try {
        await axios.patch(`/v1/rules/${userId}/${ruleId}`);
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});
