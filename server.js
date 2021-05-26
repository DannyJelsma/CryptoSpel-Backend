const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bodyParser = require('body-parser')

const temp_user = "test"
const temp_passwd = "test"

dotenv.config();

app.use(express.json());

app.post('/authenticate', (req, res) => {
    if (req.body.username === temp_user && req.body.password === temp_passwd) {
        res.json(generateToken(req.body.username));
    } else {
        // TODO: Handle
        res.send("no");
    }

    res.end();
});

app.listen(8080, () => {
    console.log('Server started on port 8080!')
});

function generateToken(username) {
    return jwt.sign({ username: username }, process.env.JWT_SECRET, { expiresIn: 3600 });
}
