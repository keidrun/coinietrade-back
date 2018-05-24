const { SimpleArbitrageStrategy } = require('./strategies/SimpleArbitrageStrategy');

/* eslint-disable no-unused-vars */
module.exports.scheduleArbitrage = async (event, context, callback) => {
  /* eslint-enable no-unused-vars */
  console.log('Doing Arbitrage...');

  // Check policy

  // Check times

  // Get Rules
  const exchangeNameA = 'bitflyer';
  const exchangeNameB = 'zaif';

  // Do Arbitrage
  const simpleArbitrageStrategy = new SimpleArbitrageStrategy(exchangeNameA, exchangeNameB);
  try {
    await simpleArbitrageStrategy.doArbitrage();
    // Decriment times
  } catch (error) {
    console.error(error);
  }
};
