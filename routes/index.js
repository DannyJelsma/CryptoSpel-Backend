const express = require('express');
const models = require('../models.js')

let router = express.Router();

router.get('/history/:ticker', async function (req, res, next) {
  let exists = await models.Coin.exists({ticker: req.params.ticker});

  if (!exists) {
    res.status(404).end();
  } else {
    let result = await models.Coin.findOne({ticker: req.params.ticker});
    res.json(result);
  }
});

module.exports = router;
