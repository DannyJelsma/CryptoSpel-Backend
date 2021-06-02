const ws = require('ws');
const fs = require('fs');

initializeWebsockets();

function initializeWebsockets() {
  let client = new ws('wss://stream.binance.com:9443/ws/test');

  client.on('close', initializeWebsockets);
  client.on('message', (msg) => {
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

      try {
        let fileName = './coins/' + coinName + '.json';
        let historyEntry = { date: Date.now(), price: price };

        if (!fs.existsSync('./coins/')) {
          fs.mkdirSync('./coins/');
        }

        if (fs.existsSync(fileName)) {
          let data = fs.readFileSync(fileName, 'utf-8');
          let json = JSON.parse(data);
          let lastHistoryEntry = json.history[json.history.length - 1];

          if (lastHistoryEntry.price !== historyEntry.price && Date.now() > new Date(lastHistoryEntry.date + 60000)) {
            json.history.push(historyEntry);
            fs.writeFileSync(fileName, JSON.stringify(json));
          }
        } else {
          fs.writeFileSync(fileName, JSON.stringify({ history: [historyEntry] }));
        }
      } catch (err) {
        throw err;
      }
    }
  });

  client.once('open', () => {
    client.send(JSON.stringify({ method: 'SUBSCRIBE', params: ['!ticker@arr'], id: 1 }));
  });
}
