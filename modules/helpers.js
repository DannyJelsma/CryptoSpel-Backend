const jwt = require('jsonwebtoken');
const models = require('../models');

function requireAuthentication(req, res, next) {
  const authorization = req.headers['authorization'];
  const token = authorization ? authorization.split('Bearer ')[1] : null;

  if (!token) return res.status(401).end();

  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) return res.status(401).end();

    const { username } = payload;

    // find user in database.
    try {
      const user = await models.User.findOne({ username });

      // make user accessible in the request.
      req.user = user;

      next();
    } catch (err) {
      console.log(err);
      res.status(400).end();
    }
  });
}

module.exports = {
  requireAuthentication,
};
