const express = require('express');
const app = express();
const dotenv = require('dotenv');
const binance = require('./modules/binance');
const database = require('./database');

dotenv.config();
app.use(express.json());

const userRouter = require('./routes/user');
const indexRouter = require('./routes/index');
app.use('/', indexRouter);
app.use('/user', userRouter);

database.connect((err) => {
  if (err) {
    console.log(err);
    process.exit();
  }

  app.listen(3000, () => {
    console.log('Server started on port 3000!');
  });
});

// root
// SiCGyJeGcW23CcMl
