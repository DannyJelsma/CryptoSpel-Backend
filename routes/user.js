const jwt = require('jsonwebtoken');
const express = require('express');
const argon2 = require('argon2');
const models = require('../models');

let router = express.Router();

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  console.log(req.body);

  try {
    const user = await models.User.findOne({
      username,
    })
      .lean()
      .exec();

    if (!user) return res.status(400).json({ messages: ['Username could not be found.'] });
    const isValid = await argon2.verify(user.password, password);
    if (!isValid)
      return res.status(400).json({
        success: false,
        errors: {
          email: [
            'Invalid username or password'
          ]
        },
        //messages: ['Username and password do not match.'],
      });

    res.status(200).json({
      success: true,
      token: generateToken(user.username),
    });
  } catch (err) {
    console.log(err);
    res.status(400).end();
  }
});

router.post('/register', async (req, res, next) => {
  const { username, password, email } = req.body;
  try {
    const user = new models.User({
      username,
      password: await argon2.hash(password),
      email,
    });

    await user.save();

    res.status(200).end();
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      return res.status(400).json({ messages: ['A unique username must be provided'] });
    }

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ messages });
    }

    res.status(400).end();
  }
});

function generateToken(username) {
  return jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: 3600 });
}

module.exports = router;
