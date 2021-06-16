const express = require('express');
const moment = require('moment');
const models = require('../models.js');
const binance = require('../modules/binance');
const { requireAuthentication } = require('../modules/helpers');

let router = express.Router();

router.get('/history/:ticker', requireAuthentication, async function (req, res, next) {
  let ticker = req.params.ticker;
  let exists = await models.Coin.exists({ ticker: ticker });

  if (!exists) {
    res.status(404).end();
  } else {
    if (!binance.historyCache.has(ticker)) {
      let result = await models.Coin.findOne({ ticker: ticker }).select({ history: 1 }).lean().exec();

      binance.historyCache.set(ticker, result);
      res.json(result);
    } else {
      res.json(binance.historyCache.get(ticker));
    }
  }
});

// Route that obtains all the currencies and metadata
let currenciesCache = {
  updated: 0,
  currencies: [],
};
router.get('/currencies', requireAuthentication, async function (req, res, next) {
  if (Date.now() - currenciesCache.updated >= 15 * 60 * 1000) {
    // It's been 15 minutes - update it.
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

      currenciesCache.updated = Date.now();
      currenciesCache.currencies = currencies;
    } catch (err) {
      console.log(err);
      return res.status(400).end();
    }
  }

  const { currencies } = currenciesCache;
  res.json(currencies);
});

module.exports = router;
