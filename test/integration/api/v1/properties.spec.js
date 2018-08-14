const { configYamlUtils, axios } = require('../../../helpers');
configYamlUtils.loadConfigYamlToEnv(process.env.NODE_ENV);
const {
  EXCHANGE_SITES,
  COIN_UNITS,
  CURRENCY_UNITS,
} = require('../../../../src/models');

describe('properties endpoints', () => {
  describe('GET /v1/exchanges', () => {
    test('should return correct exchanges properties data', done => {
      axios.get('/v1/exchanges').then(response => {
        expect(response.data).toEqual({
          [EXCHANGE_SITES.BITFLYER]: [
            {
              coinUnit: COIN_UNITS.BTC,
              currencyUnit: CURRENCY_UNITS.JPY,
            },
          ],
          [EXCHANGE_SITES.ZAIF]: [
            {
              coinUnit: COIN_UNITS.BTC,
              currencyUnit: CURRENCY_UNITS.JPY,
            },
          ],
        });
        done();
      });
    });
  });
});
