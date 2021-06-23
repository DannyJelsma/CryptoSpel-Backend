// a simple module that helps track the currency prices and metadata
const models = require('../models.js');

let _currencies = [];

updateCurrencies();
setInterval(() => updateCurrencies(), 60 * 1000);

async function updateCurrencies() {
  try {
    const coinMetadata = await models.CoinMetadata.find({});

    // loop through all the coins and add the current price
    const prices = await models.Coin.aggregate([
      {
        $project: {
          ticker: 1,
          history: {
            $filter: {
              input: '$history',
              as: 'item',
              cond: { $gt: ['$$item.date', new Date().getTime() - 1000 * 60 * 60 * 24] },
            },
          },
        },
      },
    ]);

    let currencies = [];
    for (let i = 0; i < coinMetadata.length; i++) {
      const { name, icon, graph, ticker } = coinMetadata[i];

      // match prices
      const { history: pricesFromCoin } = prices.find((i) => i.ticker === ticker + 'EUR');
      currencies.push({
        name,
        icon,
        graph,
        ticker,
        previous_price: parseFloat(pricesFromCoin[0].price),
        price: parseFloat(pricesFromCoin[pricesFromCoin.length - 1].price),
      });
    }

    _currencies = currencies;
    console.log('currencies have been updated');
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  getCurrencies: () => _currencies,
};
