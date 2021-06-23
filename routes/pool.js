const express = require('express');
const models = require('../models');
const mongoose = require('mongoose');
const currencies = require('../modules/currencies');

let router = express.Router();

// get information of user for pool (used for retrieving balance)
router.get('/user/:pool_id', async (req, res, next) => {
  const { pool_id } = req.params;

  try {
    const { balance } = await models.Participant.findOne({
      pool: pool_id,
      user: req.user._id,
    });

    res.json({
      balance,
    });
  } catch (err) {
    console.log(err);
    res.status(400).end();
  }
});

// todo: turn into a transaction
router.post('/create', async (req, res, next) => {
  const { name, budget, end_date } = req.body;
  const { _id: created_by } = req.user;

  try {
    const pool = new models.Pool({
      name,
      budget,
      end_date,
      created_by,
    });

    // add own participant entry
    const participant = new models.Participant({
      user: created_by,
      pool: pool._id,
      balance: budget,
    });

    await pool.save();
    await participant.save();

    res.json({
      pool: pool._id,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ messages });
    }

    console.log(err);
    res.status(400).end();
  }
});

// poolid = 60c9fcab8380e345048a6f83
// todo: turn into a transaction
router.post('/join/:pool_id', async (req, res, next) => {
  const { pool_id } = req.params;

  try {
    const participant = await models.Participant.findOne({
      pool: pool_id,
      user: req.user._id,
    });

    // check if user is already a participant of the pool
    let errorMessages = [];
    if (participant) errorMessages.push('User has already joined this pool.');

    // check if pool exists
    const pool = await models.Pool.findOne({
      _id: pool_id,
    });

    if (!pool) errorMessages.push('User is trying to join an unknown pool.');
    if (errorMessages.length) {
      return res.status(400).json({ messages: errorMessages });
    }

    // add user to pool
    await new models.Participant({
      user: req.user._id,
      pool: pool._id,
      balance: pool.budget,
    }).save();

    res.status(200).end();
  } catch (err) {
    console.log(err);
    res.status(400).end();
  }
});

// gets list of pools the user has joined
router.get('/list', async (req, res, next) => {
  try {
    const poolIds = (await models.Participant.find({ user: req.user._id })).map((i) => i.pool);
    const pools = await models.Pool.find({
      _id: {
        $in: poolIds,
      },
    });
    res.json({
      pools,
    });
  } catch (err) {
    console.log(err);
    res.status(400).end();
  }
});

// get list of assets the user has purchased
router.get('/assets/:pool_id', async (req, res, next) => {
  const { pool_id } = req.params;

  try {
    const assets = await models.Asset.find(
      {
        pool: pool_id,
        user: req.user._id,
      },
      {
        _id: 0,
        ticker: 1,
        amount: 1,
      }
    );

    res.json(assets);
  } catch (err) {
    console.log(err);
    res.status(400).end();
  }
});

// TODO: transaction
router.post('/:action', async (req, res, next) => {
  const { action } = req.params;
  const { ticker, pool } = req.body;
  const amount = parseFloat(req.body.amount);

  const [
    {
      history: [{ price }],
    },
  ] = await models.Coin.aggregate([
    {
      $match: {
        ticker: `${ticker}EUR`,
      },
    },
    {
      $project: {
        history: {
          $slice: ['$history', -1],
        },
      },
    },
  ]);
  if (action === 'buy') {
    try {
      const balanceToSpend = amount * price;

      // try to remove balanceToSpend from pool balance
      const { nModified } = await models.Participant.updateOne(
        {
          user: req.user._id,
          pool,
          balance: {
            $gt: balanceToSpend,
          },
        },
        {
          $inc: {
            balance: -balanceToSpend,
          },
        }
      );

      // balance has been updated
      if (nModified) {
        //  update the asset
        await models.Asset.findOneAndUpdate(
          {
            user: req.user._id,
            pool,
            ticker,
          },
          {
            $inc: {
              amount,
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );
        res.json({
          ticker,
          amount,
          balance_spent: balanceToSpend,
        });
      } else {
        res.status(400).json({
          messages: ['There is not enough balance available for this purchase.'],
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400).end();
    }
  } else if (action === 'sell') {
    // find the asset
    const asset = await models.Asset.findOne({
      user: req.user._id,
      pool,
      ticker,
    });

    // check if the user owns the asset
    if (!asset)
      return res.status(400).json({
        messages: ['User does not own this asset, or the asset does not exist.'],
      });

    // check if the user has enough of this asset
    if (asset.amount < amount)
      return res.status(400).json({
        messages: ['User does not own enough of the respective asset.'],
      });

    // remove asset balance
    asset.amount = asset.amount - amount;
    await asset.save();

    const balanceToAdd = amount * price;
    await models.Participant.updateOne(
      {
        user: req.user._id,
        pool,
      },
      {
        $inc: {
          balance: balanceToAdd,
        },
      }
    );

    // request OK
    res.json({
      balance_received: balanceToAdd,
    });
  } else next();
});

// // make a purchase in a pool
// router.get('/buy', async (req, res, next) => {
//   const { ticker, amount, pool } = req.query;
//   try {
//     const [
//       {
//         history: [{ price }],
//       },
//     ] = await models.Coin.aggregate([
//       {
//         $match: {
//           ticker: `${ticker}EUR`,
//         },
//       },
//       {
//         $project: {
//           history: {
//             $slice: ['$history', -1],
//           },
//         },
//       },
//     ]);

//     const amountToSpend = parseFloat(amount) * price;

//     // remove balance from user
//     // if enough add to asset collection

//     // find balance first
//     // const [{ participants }] = await models.Pool.aggregate([
//     //   {
//     //     $match: {
//     //       _id: mongoose.Types.ObjectId(pool),
//     //     },
//     //   },
//     //   {
//     //     $project: {
//     //       participants: {
//     //         $filter: {
//     //           input: '$participants',
//     //           as: 'item',
//     //           cond: {
//     //             $eq: ['$$item.user', String(req.user._id)],
//     //           },
//     //         },
//     //       },
//     //     },
//     //   },
//     // ]);
//     // await models.Pool.findOneAndUpdate({  })
//     // console.log(participants);

//     // const result = await models.Pool.findOne({
//     //   _id: mongoose.Types.ObjectId(pool),
//     //   participants: {
//     //     $elemMatch: {
//     //       user: '60c89521584ebb10641b0fe9',
//     //     },
//     //   },
//     // });

//     const result = await models.Pool.updateMany(
//       {
//         _id: mongoose.Types.ObjectId('60ca0aeb9478832258ed2233'),
//         'participants.user': '60be1184b6743d14240f9b70',
//       },
//       {
//         $filter: {
//           'participants.$.balance': {
//             $gt: 0,
//           },
//         },
//         $inc: {
//           'participants.$.balance': -100,
//         },
//       }
//     );

//     console.log(result);

//     const result2 = await models.Pool.findOne({
//       _id: mongoose.Types.ObjectId('60ca0aeb9478832258ed2233'),
//       'participants.user': '60be1184b6743d14240f9b70',
//     });
//     console.log(result2);

//     res.send({ ticker, amount, price, amountToSpend });
//   } catch (err) {
//     console.log(err);
//     res.status(400).end();
//   }
// });

module.exports = router;
