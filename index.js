const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const binance = require('./modules/binance');
const { requireAuthentication } = require('./modules/helpers');
const database = require('./database');

dotenv.config();
app.use(cors());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());

const userRouter = require('./routes/user');
const indexRouter = require('./routes/index');
const poolRouter = require('./routes/pool');
app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/pool', requireAuthentication, poolRouter);

database.once('open', async () => {
  app.listen(3000, () => {
    console.log('Server started on port 3000!');
  });
});
