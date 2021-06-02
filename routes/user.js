const jwt = require('jsonwebtoken');
const express = require('express');

let router = express.Router();

const temp_user = 'test';
const temp_passwd = 'test';

router.post('/authenticate', (req, res) => {
  if (req.body.username === temp_user && req.body.password === temp_passwd) {
    res.json(generateToken(req.body.username));
  } else {
    res.status(400).end();
  }
});

function generateToken(username) {
  return jwt.sign({ username: username }, process.env.JWT_SECRET, { expiresIn: 3600 });
}

module.exports = router;
