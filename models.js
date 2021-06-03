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

const User = mongoose.model('User', userSchema);
module.exports = {
  User,
};
