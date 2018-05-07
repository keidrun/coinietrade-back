const exchanges = {
  bitflyer: require('../exchanges/bitflyer'),
  zaif: require('../exchanges/zaif')
};

class SimpleArbitrageStrategy {
  constructor(exchangeNameA, exchangeNameB) {
    this.exchangeA = exchanges[exchangeNameA];
    this.exchangeB = exchanges[exchangeNameB];
  }
  async compare() {
    try {
      const responseA = await this.exchangeA.getTicker();
      const responseB = await this.exchangeB.getTicker();
      const dataA = responseA.data;
      const dataB = responseB.data;

      const askA = dataA[this.exchangeA.getTickerKeys.BID_KEY];
      const askB = dataB[this.exchangeB.getTickerKeys.BID_KEY];

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
  }
  async doArbitrage() {
    try {
      const compared = await this.compare();
      console.log(compared);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports.SimpleArbitrageStrategy = SimpleArbitrageStrategy;
