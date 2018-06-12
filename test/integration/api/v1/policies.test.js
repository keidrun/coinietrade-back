const uuid = require('uuid');
const expect = require('../../../helpers/chai').expect;
const axios = require('../../../helpers/axios');
const keys = require('../../../helpers/keys').get(process.env.NODE_ENV);
require('../../../helpers/configYamlUtils').loadConfigYamlToEnv(process.env.NODE_ENV);
const { Policy, USER_EFFECTS, USER_GRADES } = require('../../../../src/models/Policy');
const { sortByCreatedAt } = require('../../../helpers/testUtils');

before(() => {
  // Clear all policies items
  return Policy.getAll().then((existingPolicies) => {
    return existingPolicies.forEach((policy) => {
      return Policy.delete({ userId: policy.userId });
    });
  });
});

after(() => {
  // Clear all policies items
  return Policy.getAll().then((existingPolicies) => {
    return existingPolicies.forEach((policy) => {
      return Policy.delete({ userId: policy.userId });
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
          effect: USER_EFFECTS.ALLOW,
          grade: USER_GRADES.FREE,
          ruleLimit: 10,
          expiredAt: '2018-05-25T19:40:29.123Z'
        })
        .then((response) => {
          expect(response.data.effect).to.equal(USER_EFFECTS.ALLOW);
          expect(response.data.grade).to.equal(USER_GRADES.FREE);
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
        .post(`/v1/policies`, { userId: uuid.v4(), effect: USER_EFFECTS.DENY, grade: USER_GRADES.PRO })
        .then((response) => {
          expect(response.data.effect).to.equal(USER_EFFECTS.DENY);
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
          expect(response.data.effect).to.equal(USER_EFFECTS.ALLOW);
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

  describe('GET /v1/policies/{userId}', () => {
    it('should return one data response', (done) => {
      axios
        .get(`/v1/policies/${existingPolicies[0].userId}`)
        .then((response) => {
          const policy = response.data;

          expect(policy).to.deep.equal({
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

  describe('DELETE /v1/policies/{userId}', () => {
    it('should return 204 status', (done) => {
      const expectedToDeletePlicy = existingPolicies[existingPolicies.length - 1];

      axios
        .delete(`/v1/policies/${expectedToDeletePlicy.userId}`)
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

  describe('PATCH /v1/policies/{userId}', () => {
    it('should return updated data response', (done) => {
      const expectedToUpdatePolicy = existingPolicies[0];

      axios
        .patch(`/v1/policies/${expectedToUpdatePolicy.userId}`, {
          effect: USER_EFFECTS.DENY,
          grade: USER_GRADES.PRO,
          ruleLimit: 777
        })
        .then((response) => {
          const updatedPolicy = response.data;
          expectedToUpdatePolicy.effect = USER_EFFECTS.DENY;
          expectedToUpdatePolicy.grade = USER_GRADES.PRO;
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
        .patch(`/v1/policies/${expectedToUpdatePolicy.userId}`, { grade: USER_GRADES.ULTIMATE })
        .then((response) => {
          const updatedPolicy = response.data;
          expectedToUpdatePolicy.grade = USER_GRADES.ULTIMATE;

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
        .patch(`/v1/policies/${expectedToUpdatePolicy.userId}`, { ruleLimit: 100 })
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
