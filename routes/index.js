const express = require('express');
const moment = require('moment');
const models = require('../models.js');

let router = express.Router();

router.get('/history/:ticker', async function (req, res, next) {
  let exists = await models.Coin.exists({ ticker: req.params.ticker });

  if (!exists) {
    res.status(404).end();
  } else {
    let result = await models.Coin.findOne({ ticker: req.params.ticker }).exec();
    res.json(result);
  }
});

// Route that obtains all the currencies and metadata
router.get('/currencies', async function (req, res, next) {
  try {
    const coinMetadata = await models.CoinMetadata.find({});

    // loop through all the coins and add the current price
    const prices = await models.Coin.aggregate([
      // {
      //   $match: { ticker: `${ticker}EUR` },
      // },
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

    res.json(currencies);
  } catch (err) {
    console.log(err);
    res.status(400).end();
  }
});

module.exports = router;
