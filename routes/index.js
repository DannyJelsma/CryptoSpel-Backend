const express = require('express');
const models = require('../models.js');
const binance = require('../modules/binance');
const { requireAuthentication } = require('../modules/helpers');
const currencies = require('../modules/currencies');

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
router.get('/currencies', requireAuthentication, async function (req, res, next) {
  res.json(currencies.getCurrencies());
});

module.exports = router;
