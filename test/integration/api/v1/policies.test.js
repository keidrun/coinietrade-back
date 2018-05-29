const uuid = require('uuid');
const expect = require('../../../helpers/chai').expect;
const axios = require('../../../helpers/axios');
const keys = require('../../../helpers/keys').get(process.env.NODE_ENV);
require('../../../helpers/configYamlUtils').loadConfigYamlToEnv(process.env.NODE_ENV);
const { Policy } = require('../../../../src/models/Policy');
const { sortByCreatedAt } = require('../../../helpers/testUtils');

before(() => {
  // Clear all policies items
  return Policy.getAll().then((existingPolicies) => {
    return existingPolicies.forEach((policy) => {
      return Policy.delete({ id: policy.id });
    });
  });
});

after(() => {
  // Clear all policies items
  return Policy.getAll().then((existingPolicies) => {
    return existingPolicies.forEach((policy) => {
      return Policy.delete({ id: policy.id });
    });
  });
});

describe('policies endpoints', () => {
  const existingPolicies = [];

  describe('POST /v1/policies', () => {
    it('should return added data response of allow', (done) => {
      axios
        .post(`/v1/policies`, {
          userId: uuid.v4(),
          effect: 'allow',
          grade: 'free',
          ruleLimit: 10,
          expiredAt: '2018-05-25T19:40:29.123Z'
        })
        .then((response) => {
          expect(response.data.effect).to.equal('allow');
          expect(response.data.grade).to.equal('free');
          expect(response.data.ruleLimit).to.equal(10);
          expect(response.data.expiredAt).to.equal('2018-05-25T19:40:29.123Z');

          existingPolicies.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    it('should return added data response of deny', (done) => {
      axios
        .post(`/v1/policies`, { userId: uuid.v4(), effect: 'deny', grade: 'professional' })
        .then((response) => {
          expect(response.data.effect).to.equal('deny');
          existingPolicies.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    it('should return added data response of allow when empty request', (done) => {
      axios
        .post(`/v1/policies`, { userId: uuid.v4() })
        .then((response) => {
          expect(response.data.effect).to.equal('allow');
          existingPolicies.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('GET /v1/policies', () => {
    it('should return all data response', (done) => {
      axios
        .get(`/v1/policies`)
        .then((response) => {
          const policies = response.data;
          sortByCreatedAt(policies);

          expect(policies.length).equals(3);
          policies.forEach((policy, i) => {
            expect(policy).to.deep.equal({
              id: existingPolicies[i].id,
              userId: existingPolicies[i].userId,
              effect: existingPolicies[i].effect,
              grade: existingPolicies[i].grade,
              ruleLimit: existingPolicies[i].ruleLimit,
              expiredAt: existingPolicies[i].expiredAt,
              version: existingPolicies[i].version,
              createdAt: existingPolicies[i].createdAt,
              updatedAt: existingPolicies[i].updatedAt
            });
          });
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('GET /v1/policies/{id}', () => {
    it('should return one data response', (done) => {
      axios
        .get(`/v1/policies/${existingPolicies[0].id}`)
        .then((response) => {
          const policy = response.data;

          expect(policy).to.deep.equal({
            id: existingPolicies[0].id,
            userId: existingPolicies[0].userId,
            effect: existingPolicies[0].effect,
            grade: existingPolicies[0].grade,
            ruleLimit: existingPolicies[0].ruleLimit,
            expiredAt: existingPolicies[0].expiredAt,
            version: existingPolicies[0].version,
            createdAt: existingPolicies[0].createdAt,
            updatedAt: existingPolicies[0].updatedAt
          });
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('DELETE /v1/policies/{id}', () => {
    it('should return 204 status', (done) => {
      const expectedToDeletePlicy = existingPolicies[existingPolicies.length - 1];

      axios
        .delete(`/v1/policies/${expectedToDeletePlicy.id}`)
        .then((response) => {
          expect(response.status).to.equal(204);
          expect(response.data).to.be.empty;
          existingPolicies.pop();
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('PATCH /v1/policies/{id}', () => {
    it('should return updated data response', (done) => {
      const expectedToUpdatePolicy = existingPolicies[0];

      axios
        .patch(`/v1/policies/${expectedToUpdatePolicy.id}`, { effect: 'deny', grade: 'professional', ruleLimit: 777 })
        .then((response) => {
          const updatedPolicy = response.data;
          expectedToUpdatePolicy.effect = 'deny';
          expectedToUpdatePolicy.grade = 'professional';
          expectedToUpdatePolicy.ruleLimit = 777;
          expectedToUpdatePolicy.version = 1;

          expect(updatedPolicy.id).to.equal(expectedToUpdatePolicy.id);
          expect(updatedPolicy.effect).to.equal(expectedToUpdatePolicy.effect);
          expect(updatedPolicy.grade).to.equal(expectedToUpdatePolicy.grade);
          expect(updatedPolicy.ruleLimit).to.equal(expectedToUpdatePolicy.ruleLimit);
          expect(updatedPolicy.version).to.equal(expectedToUpdatePolicy.version);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    it('should return data response updated only grade field', (done) => {
      const expectedToUpdatePolicy = existingPolicies[0];

      axios
        .patch(`/v1/policies/${expectedToUpdatePolicy.id}`, { grade: 'ultimate' })
        .then((response) => {
          const updatedPolicy = response.data;
          expectedToUpdatePolicy.grade = 'ultimate';

          expect(updatedPolicy.id).to.equal(expectedToUpdatePolicy.id);
          expect(updatedPolicy.grade).to.equal(expectedToUpdatePolicy.grade);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    it('should return updated data response', (done) => {
      const expectedToUpdatePolicy = existingPolicies[0];

      axios
        .patch(`/v1/policies/${expectedToUpdatePolicy.id}`, { ruleLimit: 100 })
        .then((response) => {
          const updatedPolicy = response.data;
          expectedToUpdatePolicy.ruleLimit = 100;

          expect(updatedPolicy.id).to.equal(expectedToUpdatePolicy.id);
          expect(updatedPolicy.ruleLimit).to.equal(expectedToUpdatePolicy.ruleLimit);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });
});
