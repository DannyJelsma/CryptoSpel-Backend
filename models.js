const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
});

const coinSchema = new mongoose.Schema( {
  ticker: String,
  history: []
})

const User = mongoose.model('User', userSchema);
const Coin = mongoose.model('Coin', coinSchema)
module.exports = {
  User,
  Coin
};
