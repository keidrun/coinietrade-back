const uuid = require('uuid');
const axios = require('../../../helpers/axios');
require('../../../helpers/configYamlUtils').loadConfigYamlToEnv(
  process.env.NODE_ENV,
);
const {
  Policy,
  USER_EFFECTS,
  USER_GRADES,
} = require('../../../../src/models/Policy');
const { sortByCreatedAt } = require('../../../helpers/testUtils');

beforeAll(() => {
  // Clear all policies items
  return Policy.getAll().then(existingPolicies => {
    return existingPolicies.forEach(policy => {
      return Policy.delete({ userId: policy.userId });
    });
  });
});

afterAll(() => {
  // Clear all policies items
  return Policy.getAll().then(existingPolicies => {
    return existingPolicies.forEach(policy => {
      return Policy.delete({ userId: policy.userId });
    });
  });
});

describe('policies endpoints', () => {
  const existingPolicies = [];

  describe('POST /v1/policies', () => {
    test('should fetch added data whose effect is allow', async () => {
      const response = await axios.post(`/v1/policies`, {
        userId: uuid.v4(),
        effect: USER_EFFECTS.ALLOW,
        grade: USER_GRADES.FREE,
        ruleLimit: 10,
        expiredAt: '2018-05-25T19:40:29.123Z',
      });

      expect(response.data.effect).toBe(USER_EFFECTS.ALLOW);
      expect(response.data.grade).toBe(USER_GRADES.FREE);
      expect(response.data.ruleLimit).toBe(10);
      expect(response.data.expiredAt).toBe('2018-05-25T19:40:29.123Z');

      existingPolicies.push(response.data);
    });

    test('should fetch added data whose effect is deny', async () => {
      const response = await axios.post(`/v1/policies`, {
        userId: uuid.v4(),
        effect: USER_EFFECTS.DENY,
        grade: USER_GRADES.PRO,
      });
      expect(response.data.effect).toBe(USER_EFFECTS.DENY);
      existingPolicies.push(response.data);
    });

    test('should fetch added data whose effect is allow when empty request sent', async () => {
      const response = await axios.post(`/v1/policies`, { userId: uuid.v4() });
      expect(response.data.effect).toBe(USER_EFFECTS.ALLOW);
      existingPolicies.push(response.data);
    });
  });

  describe('GET /v1/policies', () => {
    test('should fetch all data', async () => {
      const response = await axios.get(`/v1/policies`);

      const policies = response.data;
      sortByCreatedAt(policies);

      expect(policies).toHaveLength(3);
      policies.forEach((policy, i) => {
        expect(policy).toEqual({
          userId: existingPolicies[i].userId,
          effect: existingPolicies[i].effect,
          grade: existingPolicies[i].grade,
          ruleLimit: existingPolicies[i].ruleLimit,
          expiredAt: existingPolicies[i].expiredAt,
          version: existingPolicies[i].version,
          createdAt: existingPolicies[i].createdAt,
          updatedAt: existingPolicies[i].updatedAt,
        });
      });
    });
  });

  describe('GET /v1/policies/{userId}', () => {
    test('should fetch one data response', async () => {
      const response = await axios.get(
        `/v1/policies/${existingPolicies[0].userId}`,
      );

      const policy = response.data;

      expect(policy).toEqual({
        userId: existingPolicies[0].userId,
        effect: existingPolicies[0].effect,
        grade: existingPolicies[0].grade,
        ruleLimit: existingPolicies[0].ruleLimit,
        expiredAt: existingPolicies[0].expiredAt,
        version: existingPolicies[0].version,
        createdAt: existingPolicies[0].createdAt,
        updatedAt: existingPolicies[0].updatedAt,
      });
    });

    test('should fetch 404 status when any data NOT exit', async () => {
      const userId = 'none';
      try {
        await axios.get(`/v1/policies/${userId}`);
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('DELETE /v1/policies/{userId}', () => {
    test('should fetch 204 status', async () => {
      const expectedToDeletePlicy =
        existingPolicies[existingPolicies.length - 1];

      const response = await axios.delete(
        `/v1/policies/${expectedToDeletePlicy.userId}`,
      );

      expect(response.status).toBe(204);
      expect(response.data).toBe('');
      existingPolicies.pop();
    });

    test('should fetch 404 status when any data NOT exit', async () => {
      const userId = 'none';
      try {
        await axios.delete(`/v1/policies/${userId}`);
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('PATCH /v1/policies/{userId}', () => {
    test('should fetch updated all data', async () => {
      const expectedToUpdatePolicy = existingPolicies[0];

      const response = await axios.patch(
        `/v1/policies/${expectedToUpdatePolicy.userId}`,
        {
          effect: USER_EFFECTS.DENY,
          grade: USER_GRADES.PRO,
          ruleLimit: 777,
          expiredAt: '2020-05-25T19:40:29.123Z',
        },
      );

      const updatedPolicy = response.data;
      expectedToUpdatePolicy.effect = USER_EFFECTS.DENY;
      expectedToUpdatePolicy.grade = USER_GRADES.PRO;
      expectedToUpdatePolicy.ruleLimit = 777;
      expectedToUpdatePolicy.expiredAt = '2020-05-25T19:40:29.123Z';
      expectedToUpdatePolicy.version = 1;

      expect(updatedPolicy.id).toBe(expectedToUpdatePolicy.id);
      expect(updatedPolicy.effect).toBe(expectedToUpdatePolicy.effect);
      expect(updatedPolicy.grade).toBe(expectedToUpdatePolicy.grade);
      expect(updatedPolicy.ruleLimit).toBe(expectedToUpdatePolicy.ruleLimit);
      expect(updatedPolicy.expiredAt).toBe(expectedToUpdatePolicy.expiredAt);
      expect(updatedPolicy.version).toBe(expectedToUpdatePolicy.version);
    });

    test('should fetch data updated only effect field', async () => {
      const expectedToUpdatePolicy = existingPolicies[0];

      const response = await axios.patch(
        `/v1/policies/${expectedToUpdatePolicy.userId}`,
        {
          effect: USER_EFFECTS.ALLOW,
        },
      );
      const updatedPolicy = response.data;

      expectedToUpdatePolicy.effect = USER_EFFECTS.ALLOW;
      expect(updatedPolicy.id).toBe(expectedToUpdatePolicy.id);
      expect(updatedPolicy.effect).toBe(expectedToUpdatePolicy.effect);
    });

    test('should fetch data updated only grade field', async () => {
      const expectedToUpdatePolicy = existingPolicies[0];

      const response = await axios.patch(
        `/v1/policies/${expectedToUpdatePolicy.userId}`,
        {
          grade: USER_GRADES.ULTIMATE,
        },
      );
      const updatedPolicy = response.data;

      expectedToUpdatePolicy.grade = USER_GRADES.ULTIMATE;
      expect(updatedPolicy.id).toBe(expectedToUpdatePolicy.id);
      expect(updatedPolicy.grade).toBe(expectedToUpdatePolicy.grade);
    });

    test('should fetch data updated only ruleLimit field', async () => {
      const expectedToUpdatePolicy = existingPolicies[0];

      const response = await axios.patch(
        `/v1/policies/${expectedToUpdatePolicy.userId}`,
        {
          ruleLimit: 100,
        },
      );
      const updatedPolicy = response.data;
      expectedToUpdatePolicy.ruleLimit = 100;

      expect(updatedPolicy.id).toBe(expectedToUpdatePolicy.id);
      expect(updatedPolicy.ruleLimit).toBe(expectedToUpdatePolicy.ruleLimit);
    });

    test('should fetch data updated only expiredAt field', async () => {
      const expectedToUpdatePolicy = existingPolicies[0];

      const response = await axios.patch(
        `/v1/policies/${expectedToUpdatePolicy.userId}`,
        {
          expiredAt: '2020-12-25T19:40:29.123Z',
        },
      );
      const updatedPolicy = response.data;
      expectedToUpdatePolicy.expiredAt = '2020-12-25T19:40:29.123Z';

      expect(updatedPolicy.id).toBe(expectedToUpdatePolicy.id);
      expect(updatedPolicy.expiredAt).toBe(expectedToUpdatePolicy.expiredAt);
    });

    test('should fetch 404 status when any data NOT exit', async () => {
      const userId = 'none';
      try {
        await axios.patch(`/v1/policies/${userId}`);
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});
