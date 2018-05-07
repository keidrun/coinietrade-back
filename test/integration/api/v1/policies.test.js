const { ObjectId } = require('mongodb');
const expect = require('../../../helpers/chai').expect;
const axios = require('../../../helpers/axios');
const keys = require('../../../../config/keys').get(process.env.NODE_ENV);
require('../../../helpers/configYamlUtils').loadConfigYamlToEnv(
  process.env.NODE_ENV
);
const { Policy } = require('../../../../src/models/Policy');
const { sortByCreatedAt } = require('../../../helpers/testUtils');

before(() => {
  // Clear all policies items
  return Policy.scan()
    .exec()
    .then(existingPolicies => {
      return existingPolicies.forEach(policy => {
        return Policy.delete({ id: policy.id });
      });
    });
});

after(() => {
  // Clear all policies items
  return Policy.scan()
    .exec()
    .then(existingPolicies => {
      return existingPolicies.forEach(policy => {
        return Policy.delete({ id: policy.id });
      });
    });
});

describe('policies endpoints', () => {
  const existingPolicies = [];

  describe('POST /v1/policies', () => {
    it('should return added data response of allow', done => {
      axios
        .post(`/v1/policies`, {
          userId: ObjectId().toHexString(),
          effect: 'allow'
        })
        .then(response => {
          expect(response.data.effect).to.equal('allow');
          existingPolicies.push(response.data);
          done();
        })
        .catch(error => {
          done(error);
        });
    });

    it('should return added data response of deny', done => {
      axios
        .post(`/v1/policies`, {
          userId: ObjectId().toHexString(),
          effect: 'deny'
        })
        .then(response => {
          expect(response.data.effect).to.equal('deny');
          existingPolicies.push(response.data);
          done();
        })
        .catch(error => {
          done(error);
        });
    });

    it('should return added data response of canceled', done => {
      axios
        .post(`/v1/policies`, {
          userId: ObjectId().toHexString(),
          effect: 'canceled'
        })
        .then(response => {
          expect(response.data.effect).to.equal('canceled');
          existingPolicies.push(response.data);
          done();
        })
        .catch(error => {
          done(error);
        });
    });

    it('should return added data response of errored', done => {
      axios
        .post(`/v1/policies`, {
          userId: ObjectId().toHexString(),
          effect: 'errored'
        })
        .then(response => {
          expect(response.data.effect).to.equal('errored');
          existingPolicies.push(response.data);
          done();
        })
        .catch(error => {
          done(error);
        });
    });

    it('should return added data response of allow when empty request', done => {
      axios
        .post(`/v1/policies`, { userId: ObjectId().toHexString() })
        .then(response => {
          expect(response.data.effect).to.equal('allow');
          existingPolicies.push(response.data);
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });

  describe('GET /v1/policies', () => {
    it('should return all data response', done => {
      axios
        .get(`/v1/policies`)
        .then(response => {
          const policies = response.data;
          sortByCreatedAt(policies);

          expect(policies.length).equals(5);
          policies.forEach((policy, i) => {
            expect(policy).to.deep.equal({
              id: existingPolicies[i].id,
              userId: existingPolicies[i].userId,
              effect: existingPolicies[i].effect,
              createdAt: existingPolicies[i].createdAt,
              updatedAt: existingPolicies[i].updatedAt
            });
          });
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });

  describe('GET /v1/policies/{id}', () => {
    it('should return one data response', done => {
      axios
        .get(`/v1/policies/${existingPolicies[0].id}`)
        .then(response => {
          const policy = response.data;

          expect(policy).to.deep.equal({
            id: existingPolicies[0].id,
            userId: existingPolicies[0].userId,
            effect: existingPolicies[0].effect,
            createdAt: existingPolicies[0].createdAt,
            updatedAt: existingPolicies[0].updatedAt
          });
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });

  describe('DELETE /v1/policies/{id}', () => {
    it('should return 204 status', done => {
      const expectedToDeletePlicy =
        existingPolicies[existingPolicies.length - 1];

      axios
        .delete(`/v1/policies/${expectedToDeletePlicy.id}`)
        .then(response => {
          expect(response.status).to.equal(204);
          expect(response.data).to.be.empty;
          existingPolicies.pop();
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });

  describe('PATCH /v1/policies/{id}', () => {
    it('should return updated data response', done => {
      const expectedToUpdatePolicy = existingPolicies[0];

      axios
        .patch(`/v1/policies/${expectedToUpdatePolicy.id}`, { effect: 'deny' })
        .then(response => {
          const updatedPolicy = response.data;
          expectedToUpdatePolicy.effect = 'deny';

          expect(updatedPolicy.id).to.equal(expectedToUpdatePolicy.id);
          expect(updatedPolicy.effect).to.equal(expectedToUpdatePolicy.effect);
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });
});
