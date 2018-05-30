const uuid = require('uuid');
const expect = require('../../../helpers/chai').expect;
const axios = require('../../../helpers/axios');
const keys = require('../../../helpers/keys').get(process.env.NODE_ENV);
require('../../../helpers/configYamlUtils').loadConfigYamlToEnv(process.env.NODE_ENV);
const { Rule } = require('../../../../src/models/Rule');
const { sortByCreatedAt } = require('../../../helpers/testUtils');

before(() => {
  // Clear all Rules items
  return Rule.getAll().then((existingRules) => {
    return existingRules.forEach((rule) => {
      return Rule.delete({ userId: rule.userId, ruleId: rule.ruleId });
    });
  });
});

after(() => {
  // Clear all Rules items
  return Rule.getAll().then((existingRules) => {
    return existingRules.forEach((rule) => {
      return Rule.delete({ userId: rule.userId, ruleId: rule.ruleId });
    });
  });
});

describe('rules endpoints', () => {
  const existingRules = [];
  const groupUserId = uuid.v4();

  describe('POST /v1/rules', () => {
    it('should return added data response with all arguments', (done) => {
      axios
        .post(`/v1/rules`, {
          userId: groupUserId,
          priority: 1,
          arbitrageStrategy: 'simple',
          coinUnit: 'btc',
          currencyUnit: 'jpy',
          orderType: 'limit_order',
          assetRange: 0.1,
          commitmentTimeLimit: 600,
          buyWeightRate: 0.001,
          sellWeightRate: -0.001,
          oneSiteName: 'bitflyer',
          otherSiteName: 'zaif'
        })
        .then((response) => {
          expect(response.data.priority).to.equal(1);
          expect(response.data.arbitrageStrategy).to.equal('simple');
          expect(response.data.coinUnit).to.equal('btc');
          expect(response.data.currencyUnit).to.equal('jpy');
          expect(response.data.orderType).to.equal('limit_order');
          expect(response.data.assetRange).to.equal(0.1);
          expect(response.data.commitmentTimeLimit).to.equal(600);
          expect(response.data.buyWeightRate).to.equal(0.001);
          expect(response.data.sellWeightRate).to.equal(-0.001);
          expect(response.data.oneSiteName).to.equal('bitflyer');
          expect(response.data.otherSiteName).to.equal('zaif');
          expect(response.data.status).to.equal('available');
          existingRules.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    it('should return added data response with all arguments', (done) => {
      axios
        .post(`/v1/rules`, {
          userId: groupUserId,
          priority: 2,
          arbitrageStrategy: 'simple',
          coinUnit: 'btc',
          currencyUnit: 'jpy',
          orderType: 'market_order',
          assetRange: 1.0,
          commitmentTimeLimit: 888,
          buyWeightRate: -0.001,
          sellWeightRate: 0.001,
          oneSiteName: 'bitflyer',
          otherSiteName: 'zaif'
        })
        .then((response) => {
          expect(response.data.priority).to.equal(2);
          expect(response.data.arbitrageStrategy).to.equal('simple');
          expect(response.data.coinUnit).to.equal('btc');
          expect(response.data.currencyUnit).to.equal('jpy');
          expect(response.data.orderType).to.equal('market_order');
          expect(response.data.assetRange).to.equal(1.0);
          expect(response.data.commitmentTimeLimit).to.equal(888);
          expect(response.data.buyWeightRate).to.equal(-0.001);
          expect(response.data.sellWeightRate).to.equal(0.001);
          expect(response.data.oneSiteName).to.equal('bitflyer');
          expect(response.data.otherSiteName).to.equal('zaif');
          expect(response.data.status).to.equal('available');
          existingRules.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    it('should return added data response without option arguments', (done) => {
      axios
        .post(`/v1/rules`, {
          userId: uuid.v4(),
          arbitrageStrategy: 'simple',
          coinUnit: 'btc',
          currencyUnit: 'jpy',
          assetRange: 0.05,
          commitmentTimeLimit: 1200,
          oneSiteName: 'zaif',
          otherSiteName: 'bitflyer'
        })
        .then((response) => {
          expect(response.data.priority).to.equal(0);
          expect(response.data.arbitrageStrategy).to.equal('simple');
          expect(response.data.coinUnit).to.equal('btc');
          expect(response.data.currencyUnit).to.equal('jpy');
          expect(response.data.orderType).to.equal('limit_order');
          expect(response.data.assetRange).to.equal(0.05);
          expect(response.data.commitmentTimeLimit).to.equal(1200);
          expect(response.data.oneSiteName).to.equal('zaif');
          expect(response.data.otherSiteName).to.equal('bitflyer');
          expect(response.data.counts).to.deep.equal({
            executionCount: 0,
            successCount: 0,
            failureCount: 0,
            cancellationCount: 0
          });
          existingRules.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('GET /v1/rules', () => {
    it('should return all data response', (done) => {
      axios
        .get(`/v1/rules`)
        .then((response) => {
          const rules = response.data;
          sortByCreatedAt(rules);

          expect(rules.length).equals(3);
          rules.forEach((rule, i) => {
            expect(rule).to.deep.equal({
              userId: existingRules[i].userId,
              ruleId: existingRules[i].ruleId,
              priority: existingRules[i].priority,
              arbitrageStrategy: existingRules[i].arbitrageStrategy,
              coinUnit: existingRules[i].coinUnit,
              currencyUnit: existingRules[i].currencyUnit,
              orderType: existingRules[i].orderType,
              assetRange: existingRules[i].assetRange,
              commitmentTimeLimit: existingRules[i].commitmentTimeLimit,
              buyWeightRate: existingRules[i].buyWeightRate,
              sellWeightRate: existingRules[i].sellWeightRate,
              oneSiteName: existingRules[i].oneSiteName,
              otherSiteName: existingRules[i].otherSiteName,
              totalProfit: existingRules[i].totalProfit,
              counts: existingRules[i].counts,
              status: existingRules[i].status,
              version: existingRules[i].version,
              createdAt: existingRules[i].createdAt,
              updatedAt: existingRules[i].updatedAt
            });
          });
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('GET /v1/rules/{userId}', () => {
    it('should return data with the same userId', (done) => {
      axios
        .get(`/v1/rules/${groupUserId}`)
        .then((response) => {
          const rules = response.data;
          sortByCreatedAt(rules);

          expect(rules.length).equals(2);
          rules.forEach((rule, i) => {
            expect(rule).to.deep.equal({
              userId: existingRules[i].userId,
              ruleId: existingRules[i].ruleId,
              priority: existingRules[i].priority,
              arbitrageStrategy: existingRules[i].arbitrageStrategy,
              coinUnit: existingRules[i].coinUnit,
              currencyUnit: existingRules[i].currencyUnit,
              orderType: existingRules[i].orderType,
              assetRange: existingRules[i].assetRange,
              commitmentTimeLimit: existingRules[i].commitmentTimeLimit,
              buyWeightRate: existingRules[i].buyWeightRate,
              sellWeightRate: existingRules[i].sellWeightRate,
              oneSiteName: existingRules[i].oneSiteName,
              otherSiteName: existingRules[i].otherSiteName,
              totalProfit: existingRules[i].totalProfit,
              counts: existingRules[i].counts,
              status: existingRules[i].status,
              version: existingRules[i].version,
              createdAt: existingRules[i].createdAt,
              updatedAt: existingRules[i].updatedAt
            });
          });
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('DELETE /v1/rules/{userId}/{ruleId}', () => {
    it('should return 204 status', (done) => {
      const expectedToDeleteRule = existingRules[existingRules.length - 1];
      axios
        .delete(`/v1/rules/${expectedToDeleteRule.userId}/${expectedToDeleteRule.ruleId}`)
        .then((response) => {
          expect(response.status).to.equal(204);
          expect(response.data).to.be.empty;
          existingRules.pop();
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });
});
