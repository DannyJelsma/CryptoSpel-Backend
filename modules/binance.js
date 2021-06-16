const ws = require('ws');
const models = require('../models.js');

initializeWebsockets();
setInterval(pushQueueToDatabase, 60000);

let dataQueue = new Map();
let historyCache = new Map();

async function pushQueueToDatabase() {
  for (let [ticker, entry] of dataQueue) {
    let exists = await models.Coin.exists({ticker: ticker});

    if (!exists) {
      await new models.Coin({ ticker: ticker, history: [entry]}).save();
      continue;
    }

    await models.Coin.updateOne({ticker: ticker}, { $push: { history: entry } });

    if (historyCache.has(ticker)) {
      let history = historyCache.get(ticker);

      history.history.push(entry);
      historyCache.set(ticker, history);
    }
  }

  dataQueue.clear();
}

function initializeWebsockets() {
  let client = new ws('wss://stream.binance.com:9443/ws/test');

  client.on('close', initializeWebsockets);
  client.on('message', handleMessage);

  client.once('open', () => {
    client.send(JSON.stringify({ method: 'SUBSCRIBE', params: ['!ticker@arr'], id: 1 }));
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
    let price = parseFloat(coin.b); // <- highest bid price

    // Only add coins that support EUR.
    if (!coinName.endsWith('EUR')) continue;

    if (price > 1) {
      price = parseFloat(price.toFixed(2));
    }

    let historyEntry = {date: Date.now(), price: price};

    if (dataQueue.has(coinName)) {
      let lastEntry = dataQueue.get(coinName);

      if (Date.now() > new Date(lastEntry.date + 60000)) {
        dataQueue.set(coinName, historyEntry);
      }
    } else {
      dataQueue.set(coinName, historyEntry);
    }
  }
}

module.exports = {
  historyCache
};
