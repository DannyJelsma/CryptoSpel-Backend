const MongoClient = require('mongodb').MongoClient;
const uri = 'mongodb+srv://root:SiCGyJeGcW23CcMl@cluster0.9cden.mongodb.net/Project?retryWrites=true&w=majority';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

module.exports = client;
