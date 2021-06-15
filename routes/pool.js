const express = require('express');
const models = require('../models');

let router = express.Router();

// TODO: only allowed when authenticated
router.post('/create', async (req, res, next) => {
  const { name, budget, end_date } = req.body;

  try {
    const pool = new models.Pool({
      name,
      budget,
      end_date,
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

    res.status(400).end();
  }
});

module.exports = router;
