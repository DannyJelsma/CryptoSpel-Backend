const express = require('express');
const models = require('../models');

let router = express.Router();

router.post('/create', async (req, res, next) => {
  const { name, budget, end_date } = req.body;
  const { _id: created_by } = req.user;

  try {
    const pool = new models.Pool({
      name,
      budget,
      end_date,
      created_by,
      participants: [
        {
          user: req.user._id,
          balance: budget,
        },
      ],
    });

    await pool.save();
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
router.post('/join/:pool_id', async (req, res, next) => {
  const { pool_id } = req.params;

  try {
    const pool = await models.Pool.findOne({ _id: pool_id });

    // check if user is already a participant of the pool
    let errorMessages = [];
    if (pool.participants.map((i) => i.user).includes(req.user._id)) errorMessages.push('User has already joined this pool.');

    if (errorMessages.length) {
      return res.status(400).json({ messages: errorMessages });
    }

    // add user to pool
    await models.Pool.updateOne(
      { _id: pool._id },
      {
        $push: {
          participants: {
            user: req.user._id,
            balance: pool.budget,
          },
        },
      }
    );
    res.status(200).end();
  } catch (err) {
    console.log(err);
    res.status(400).end();
  }
});

// gets list of pools the user has joined
// {}, { fitlers here }
router.get('/list', async (req, res, next) => {
  try {
    const pools = await models.Pool.find({ 'participants.user': req.user._id }, { participants: 0 });
    res.json({
      pools,
    });
  } catch (err) {
    console.log(err);
    res.status(400).end();
  }
});

module.exports = router;
