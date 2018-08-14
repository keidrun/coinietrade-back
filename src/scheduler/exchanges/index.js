const errors = require('./errors');
const Bitflyer = require('./Bitflyer');
const Zaif = require('./Zaif');

const Exchanges = {
  bitflyer: Bitflyer,
  zaif: Zaif,
};

module.exports = {
  errors,
  Exchanges,
};
