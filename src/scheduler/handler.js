const exchanges = {
  bitflyer: require('./exchanges/bitflyer'),
  zaif: require('./exchanges/zaif')
};

const compare = async (exchangeNameA, exchangeNameB) => {
  const exchangeApiA = exchanges[exchangeNameA];
  const exchangeApiB = exchanges[exchangeNameB];

  try {
    const responseA = await exchangeApiA.getTicker();
    const responseB = await exchangeApiB.getTicker();
    const dataA = responseA.data;
    const dataB = responseB.data;

    const askA = dataA[exchangeApiA.BID_KEY];
    const askB = dataB[exchangeApiB.BID_KEY];

    if (askA > askB) {
      return 1;
    } else if (askA < askB) {
      return -1;
    } else {
      return 0;
    }
  } catch (error) {
    throw new Error(error);
  }
};

module.exports.scheduleArbitrage = async (event, context, callback) => {
  console.log('Doing Arbitrage...');
  try {
    const compared = await compare('bitflyer', 'zaif');
    console.log(compared);
  } catch (error) {
    console.error(error);
  }
};
