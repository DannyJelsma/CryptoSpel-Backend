const models = require('../models');
const database = require('../database');

database.once('open', async () => {
  const ticker = 'TESTCOIN';

  let coin;
  if (await models.Test.exists({ ticker })) {
    // exists
    coin = await models.Test.findOne({ ticker });
  } else {
    coin = new models.Test({
      ticker,
      history: [],
    });

    await coin.save();
  }

  // add new entry every second
  setInterval(async function () {
    const history = { date: Date.now(), price: parseFloat((Math.random() * 100).toFixed(2)) };
    await models.Test.updateOne({ _id: coin._id }, { $push: { history } });

    console.log('pushed', history);
  }, 1000);
});
