const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const ws = require('ws');
const fs = require('fs');

const temp_user = 'test'
const temp_passwd = 'test'

dotenv.config();
app.use(express.json());

app.post('/authenticate', (req, res) => {
    if (req.body.username === temp_user && req.body.password === temp_passwd) {
        res.json(generateToken(req.body.username));
    } else {
        res.status(400).end();
    }
});

app.get('/history/:ticker', (req, res) => {
    let fileName = './coins/' + req.params.ticker + '.json';

    fs.readFile( fileName, (err, json) => {
        if (err) {
            res.status(404).end();
        } else {
            res.send(json);
        }
    });
})

app.listen(8080, () => {
    console.log('Server started on port 8080!');
});

initializeWebsockets();

function initializeWebsockets() {
    let client = new ws('wss://stream.binance.com:9443/ws/test');

    client.on('message', msg => {
        let updates = JSON.parse(msg);

        for (let update in updates) {
            let coin = updates[update];

            // Get rid of some invalid values that Binance sends.
            if (coin === null || coin === 1) {
                continue;
            }

            let coinName = coin.s;
            let price = coin.o;

            try {
                let fileName = './coins/' + coinName + '.json';
                let historyEntry = { date: Date.now(), price: price};

                if (!fs.existsSync('./coins/')) {
                    fs.mkdirSync('./coins/')
                }

                if (fs.existsSync(fileName)) {
                    let data = fs.readFileSync(fileName, 'utf-8');
                    let json = JSON.parse(data);

                    if (json.history[json.history.length] !== historyEntry.price) {
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
        client.send(JSON.stringify({ method: 'SUBSCRIBE', params: ['!ticker@arr'], id: 1}));
    });

}

function generateToken(username) {
    return jwt.sign({ username: username }, process.env.JWT_SECRET, { expiresIn: 3600 });
}
