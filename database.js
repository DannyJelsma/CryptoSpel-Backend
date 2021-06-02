// const MongoClient = require('mongodb').MongoClient;
// const uri = 'mongodb+srv://root:SiCGyJeGcW23CcMl@cluster0.9cden.mongodb.net/cryptospel?retryWrites=true&w=majority';
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// let instance;
// module.exports = {
//   connect: function (callback) {
//     client.connect((err, database) => {
//       instance = database.db('cryptospel');
//       return callback(err);
//     });
//   },
//   getInstance: () => instance,
// };

// // mongoose -> https://www.youtube.com/watch?v=b59Pdt5LJG8

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://root:SiCGyJeGcW23CcMl@cluster0.9cden.mongodb.net/cryptospel', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const database = mongoose.connection;
database.on('error', console.error.bind(console, 'connection error:'));

module.exports = database;
