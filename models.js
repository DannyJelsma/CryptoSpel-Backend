const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'A username must be provided.'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'A password must be provided.'],
  },
  email: {
    type: String,
    required: [true, 'An email must be provided.'],
  },
});

const coinSchema = new mongoose.Schema( {
  ticker: {
    type: String,
    required: [true, 'A ticker must be provided.'],
    unique: true,
  },
  history: []
})

const User = mongoose.model('User', userSchema);
const Coin = mongoose.model('Coin', coinSchema)
module.exports = {
  User,
  Coin
};
