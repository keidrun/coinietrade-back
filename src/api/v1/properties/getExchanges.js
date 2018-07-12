const { response } = require('../../../utils/response');
const {
  EXCHANGE_SITES,
  COIN_UNITS,
  CURRENCY_UNITS,
} = require('../../../models/Rule');

module.exports.getExchanges = async (event, callback) => {
  const exchanges = {
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
  };
  callback(null, response(200, exchanges));
};
