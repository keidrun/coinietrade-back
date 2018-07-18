const uuid = require('uuid');
const axios = require('../../../helpers/axios');
const keys = require('../../../helpers/keys').get(process.env.NODE_ENV);
require('../../../helpers/configYamlUtils').loadConfigYamlToEnv(process.env.NODE_ENV);
const { Policy, USER_EFFECTS, USER_GRADES } = require('../../../../src/models/Policy');
const { sortByCreatedAt } = require('../../../helpers/testUtils');

beforeAll(() => {
  // Clear all policies items
  return Policy.getAll().then((existingPolicies) => {
    return existingPolicies.forEach((policy) => {
      return Policy.delete({ userId: policy.userId });
    });
  });
});

afterAll(() => {
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
    test('should return added data response of allow', (done) => {
      axios
        .post(`/v1/policies`, {
          userId: uuid.v4(),
          effect: USER_EFFECTS.ALLOW,
          grade: USER_GRADES.FREE,
          ruleLimit: 10,
          expiredAt: '2018-05-25T19:40:29.123Z'
        })
        .then((response) => {
          expect(response.data.effect).toBe(USER_EFFECTS.ALLOW);
          expect(response.data.grade).toBe(USER_GRADES.FREE);
          expect(response.data.ruleLimit).toBe(10);
          expect(response.data.expiredAt).toBe('2018-05-25T19:40:29.123Z');

          existingPolicies.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    test('should return added data response of deny', (done) => {
      axios
        .post(`/v1/policies`, { userId: uuid.v4(), effect: USER_EFFECTS.DENY, grade: USER_GRADES.PRO })
        .then((response) => {
          expect(response.data.effect).toBe(USER_EFFECTS.DENY);
          existingPolicies.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    test('should return added data response of allow when empty request', (done) => {
      axios
        .post(`/v1/policies`, { userId: uuid.v4() })
        .then((response) => {
          expect(response.data.effect).toBe(USER_EFFECTS.ALLOW);
          existingPolicies.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('GET /v1/policies', () => {
    test('should return all data response', (done) => {
      axios
        .get(`/v1/policies`)
        .then((response) => {
          const policies = response.data;
          sortByCreatedAt(policies);

          expect(policies.length).toBe(3);
          policies.forEach((policy, i) => {
            expect(policy).toEqual({
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
    test('should return one data response', (done) => {
      axios
        .get(`/v1/policies/${existingPolicies[0].userId}`)
        .then((response) => {
          const policy = response.data;

          expect(policy).toEqual({
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
    test('should return 204 status', (done) => {
      const expectedToDeletePlicy = existingPolicies[existingPolicies.length - 1];

      axios
        .delete(`/v1/policies/${expectedToDeletePlicy.userId}`)
        .then((response) => {
          expect(response.status).toBe(204);
          expect(response.data).toBe("") ;
          existingPolicies.pop();
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('PATCH /v1/policies/{userId}', () => {
    test('should return updated data response', (done) => {
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

          expect(updatedPolicy.id).toBe (expectedToUpdatePolicy.id);
          expect(updatedPolicy.effect).toBe(expectedToUpdatePolicy.effect);
          expect(updatedPolicy.grade).toBe(expectedToUpdatePolicy.grade);
          expect(updatedPolicy.ruleLimit).toBe(expectedToUpdatePolicy.ruleLimit);
          expect(updatedPolicy.version).toBe(expectedToUpdatePolicy.version);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    test('should return data response updated only grade field', (done) => {
      const expectedToUpdatePolicy = existingPolicies[0];

      axios
        .patch(`/v1/policies/${expectedToUpdatePolicy.userId}`, { grade: USER_GRADES.ULTIMATE })
        .then((response) => {
          const updatedPolicy = response.data;
          expectedToUpdatePolicy.grade = USER_GRADES.ULTIMATE;

          expect(updatedPolicy.id).toBe(expectedToUpdatePolicy.id);
          expect(updatedPolicy.grade).toBe(expectedToUpdatePolicy.grade);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    test('should return updated data response', (done) => {
      const expectedToUpdatePolicy = existingPolicies[0];

      axios
        .patch(`/v1/policies/${expectedToUpdatePolicy.userId}`, { ruleLimit: 100 })
        .then((response) => {
          const updatedPolicy = response.data;
          expectedToUpdatePolicy.ruleLimit = 100;

          expect(updatedPolicy.id).toBe(expectedToUpdatePolicy.id);
          expect(updatedPolicy.ruleLimit).toBe(expectedToUpdatePolicy.ruleLimit);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });
});
