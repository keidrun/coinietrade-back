const uuid = require('uuid');
const expect = require('../../../helpers/chai').expect;
const axios = require('../../../helpers/axios');
const keys = require('../../../helpers/keys').get(process.env.NODE_ENV);
require('../../../helpers/configYamlUtils').loadConfigYamlToEnv(process.env.NODE_ENV);
const { Wallet } = require('../../../../src/models/Wallet');
const { sortByCreatedAt } = require('../../../helpers/testUtils');

before(() => {
  // Clear all Wallets items
  return Wallet.scan().exec().then((existingWallets) => {
    return existingWallets.forEach((wallet) => {
      return Wallet.delete({ id: wallet.id });
    });
  });
});

after(() => {
  // Clear all Wallets items
  return Wallet.scan().exec().then((existingWallets) => {
    return existingWallets.forEach((wallet) => {
      return Wallet.delete({ id: wallet.id });
    });
  });
});

describe('wallets endpoints', () => {
  const existingWallets = [];

  describe('POST /v1/wallets', () => {
    it('should return added data response of bitflyer', (done) => {
      axios
        .post(`/v1/wallets`, {
          userId: uuid.v4(),
          company: 'bitflyer',
          addressType: 'btc',
          address: 'ANY_Wallet_ADDRESS'
        })
        .then((response) => {
          expect(response.data.company).to.equal('bitflyer');
          expect(response.data.addressType).to.equal('btc');
          expect(response.data.address).to.be.undefined;
          existingWallets.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });

    it('should return added data response of zaif', (done) => {
      axios
        .post(`/v1/wallets`, {
          userId: uuid.v4(),
          company: 'zaif',
          addressType: 'btc',
          address: 'ANY_Wallet_ADDRESS'
        })
        .then((response) => {
          expect(response.data.company).to.equal('zaif');
          expect(response.data.addressType).to.equal('btc');
          expect(response.data.address).to.be.undefined;
          existingWallets.push(response.data);
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  describe('DELETE /v1/wallets/{id}', () => {
    it('should return 204 status', (done) => {
      const expectedToDeleteWallet = existingWallets[existingWallets.length - 1];

      axios
        .delete(`/v1/wallets/${expectedToDeleteWallet.id}`)
        .then((response) => {
          expect(response.status).to.equal(204);
          expect(response.data).to.be.empty;
          existingWallets.pop();
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });
});
