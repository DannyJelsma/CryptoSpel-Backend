const express = require('express');

let router = express.Router();

router.get('/history/:ticker', (req, res) => {
  try {
    let fileName = './coins/' + req.params.ticker + '.json';
    let data = fs.readFileSync(fileName, 'utf-8');

    res.json(JSON.parse(data));
  } catch (err) {
    res.status(404).end();
  }
});

module.exports = router;
