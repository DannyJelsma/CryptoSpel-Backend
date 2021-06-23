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
    historyIgnore: true,
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

const poolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A pool name must be provided.'],
  },
  budget: {
    required: [true, 'A budget must be provided.'],
    type: Number,
    min: [1000, 'The budget must be more than €1,000.'],
    max: [1000000, 'The budget must be below €1,000,000.'],
  },
  end_date: {
    required: [true, 'An end date must be provided.'],
    type: Date,
    validate: {
      // https://stackoverflow.com/questions/66927667/mongoose-schema-set-min-and-max-dates
      validator: (v) => v && v.getTime() > Date.now() + 24 * 60 * 60 * 1000,
      message: 'A pool may not end within 24 hours.',
    },
  },
  created_by: String,
});

const participantSchema = new mongoose.Schema({
  pool: String,
  user: String,
  balance: Number,
});

const assetSchema = new mongoose.Schema({
  pool: String,
  user: String,
  ticker: String,
  amount: {
    type: Number,
    default: 0,
  },
});

const CoinMetadata = mongoose.model('CoinMetadata', coinMetadataSchema);
const User = mongoose.model('User', userSchema);
const Coin = mongoose.model('Coin', coinSchema);
const Pool = mongoose.model('Pool', poolSchema);
const Asset = mongoose.model('Asset', assetSchema);
const Participant = mongoose.model('Participant', participantSchema);
module.exports = {
  User,
  Coin,
  CoinMetadata,
  Asset,
  Pool,
  Participant,
};
