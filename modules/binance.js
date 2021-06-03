const ws = require('ws');
const models = require('../models.js');

initializeWebsockets();

function initializeWebsockets() {
  let client = new ws('wss://stream.binance.com:9443/ws/test');

  client.on('close', initializeWebsockets);
  client.on('message', handleMessage);

  client.once('open', () => {
    client.send(JSON.stringify({method: 'SUBSCRIBE', params: ['!ticker@arr'], id: 1}));
  });
}

async function handleMessage(msg) {
  let updates = JSON.parse(msg);

  for (let update in updates) {
    let coin = updates[update];

    // Get rid of some invalid values that Binance sends.
    if (coin === null || coin === 1) {
      continue;
    }

    let coinName = coin.s;
    let price = coin.o;

    if (!coinName.endsWith('EUR')) continue;

    let exists = await models.Coin.exists({ticker: coinName});
    let historyEntry = {date: Date.now(), price: parseFloat(price)};
    if (exists) {
      let coin = await models.Coin.findOne({ticker: coinName}).exec();
      let lastHistoryEntry = coin.history[coin.history.length - 1];

      if (lastHistoryEntry.price !== historyEntry.price && Date.now() > new Date(lastHistoryEntry.date + 60000)) {
        coin.history.push(historyEntry);
        await coin.save();
      }
    } else {
      await new models.Coin({ticker: coinName, history: [historyEntry]}).save();
    }
  }
}
