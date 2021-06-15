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
    unique: true,
  },
});

const coinSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: [true, 'A ticker must be provided.'],
    unique: true,
    historyIgnore: true
  },
  history: [
    {
      date: Number,
      price: Number,
    },
  ],
});

const coinMetadataSchema = new mongoose.Schema({
  name: String,
  icon: String,
  graph: String,
  ticker: {
    type: String,
    unique: true,
  },
});

const testSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: [true, 'A ticker must be provided.'],
    unique: true,
  },
  history: [
    {
      date: Number,
      price: Number,
    },
  ],
});

const CoinMetadata = mongoose.model('CoinMetadata', coinMetadataSchema);
const User = mongoose.model('User', userSchema);
const Coin = mongoose.model('Coin', coinSchema);
const Test = mongoose.model('Test', testSchema);
module.exports = {
  User,
  Coin,
  CoinMetadata,
  Test,
};
