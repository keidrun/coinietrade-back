const uuid = require('uuid');
const expect = require('../../../helpers/chai').expect;
const axios = require('../../../helpers/axios');
const keys = require('../../../helpers/keys').get(process.env.NODE_ENV);
require('../../../helpers/configYamlUtils').loadConfigYamlToEnv(process.env.NODE_ENV);
const { Rule } = require('../../../../src/models/Rule');
const { sortByCreatedAt } = require('../../../helpers/testUtils');

before(() => {
  // Clear all Rules items
  return Rule.scan().exec().then((existingRules) => {
    return existingRules.forEach((rule) => {
      return Rule.delete({ id: rule.id });
    });
  });
});

after(() => {
  // Clear all Rules items
  return Rule.scan().exec().then((existingRules) => {
    return existingRules.forEach((rule) => {
      return Rule.delete({ id: rule.id });
    });
  });
});

describe('rules endpoints', () => {
  const existingRules = [];

  describe('POST /v1/rules', () => {
    it('should return added data response with all arguments', (done) => {
      axios
        .post(`/v1/rules`, {
          userId: uuid.v4(),
          priority: 1,
          arbitrageStrategy: 'simple',
          orderType: 'limit_order',
          coinUnit: 'btc',
          currencyUnit: 'jpy',
          orderAmount: 0.0005,
          orderPrice: 800000,
          orderPriority: 0,
          priceDifference: 10000,
          sites: [
            {
              name: 'bitflyer',
              expectedTransactionFeeRate: 0.001,
              expectedRemittanceFee: 0.0004
            },
            {
              name: 'zaif',
              expectedTransactionFeeRate: -0.01,
              expectedRemittanceFee: 0.0004
            }
          ],
          counts: {
            executionCount: 4,
            successCount: 3,
            failureCount: 2,
            retryCount: 1
          },
          expiredAt: '2018-05-25T19:40:29.123Z'
        })
        .then((response) => {
          expect(response.data.priority).to.equal(1);
          expect(response.data.arbitrageStrategy).to.equal('simple');
          expect(response.data.orderType).to.equal('limit_order');
          expect(response.data.coinUnit).to.equal('btc');
          expect(response.data.currencyUnit).to.equal('jpy');
          expect(response.data.orderAmount).to.equal(0.0005);
          expect(response.data.orderPrice).to.equal(800000);
          expect(response.data.orderPriority).to.equal(0);
          expect(response.data.priceDifference).to.equal(10000);
          expect(response.data.sites.length).to.equal(2);
          expect(response.data.sites[0]).to.deep.equal({
            name: 'bitflyer',
            expectedTransactionFeeRate: 0.001,
            expectedRemittanceFee: 0.0004
          });
          expect(response.data.sites[1]).to.deep.equal({
            name: 'zaif',
            expectedTransactionFeeRate: -0.01,
            expectedRemittanceFee: 0.0004
          });
          expect(response.data.counts).to.deep.equal({
            executionCount: 4,
            successCount: 3,
            failureCount: 2,
            retryCount: 1
          });
          expect(response.data.expiredAt).to.equal('2018-05-25T19:40:29.123Z');
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
          orderAmount: 0.001,
          orderPrice: 999999,
          priceDifference: 777,
          sites: [
            {
              name: 'zaif',
              expectedTransactionFeeRate: 0.005,
              expectedRemittanceFee: 0.0006
            },
            {
              name: 'bitflyer',
              expectedTransactionFeeRate: -0.05,
              expectedRemittanceFee: 0.0006
            }
          ]
        })
        .then((response) => {
          expect(response.data.priority).to.equal(0);
          expect(response.data.arbitrageStrategy).to.equal('simple');
          expect(response.data.orderType).to.equal('limit_order');
          expect(response.data.coinUnit).to.equal('btc');
          expect(response.data.currencyUnit).to.equal('jpy');
          expect(response.data.orderAmount).to.equal(0.001);
          expect(response.data.orderPrice).to.equal(999999);
          expect(response.data.orderPriority).to.equal(0);
          expect(response.data.priceDifference).to.equal(777);
          expect(response.data.sites.length).to.equal(2);
          expect(response.data.sites[0]).to.deep.equal({
            name: 'zaif',
            expectedTransactionFeeRate: 0.005,
            expectedRemittanceFee: 0.0006
          });
          expect(response.data.sites[1]).to.deep.equal({
            name: 'bitflyer',
            expectedTransactionFeeRate: -0.05,
            expectedRemittanceFee: 0.0006
          });
          expect(response.data.counts).to.deep.equal({
            executionCount: 0,
            successCount: 0,
            failureCount: 0,
            retryCount: 0
          });
          existingRules.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('DELETE /v1/rules/{id}', () => {
    it('should return 204 status', (done) => {
      const expectedToDeleteRule = existingRules[existingRules.length - 1];

      axios
        .delete(`/v1/rules/${expectedToDeleteRule.id}`)
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
