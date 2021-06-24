// a simple module that helps track the currency prices and metadata
const models = require('../models.js');

let _leaderboards = {};
let _currencies = [];

setInterval(() => updateCurrencies(), 60 * 1000);
updateCurrencies().then(() => {
  updateLeaderboards();
  setInterval(() => updateLeaderboards(), 5 * 60 * 1000);
});

async function updateCurrencies() {
  try {
    const coinMetadata = await models.CoinMetadata.find({});

    // loop through all the coins and add the current price
    const prices = await models.Coin.aggregate([
      {
        $project: {
          ticker: 1,
          history: {
            $filter: {
              input: '$history',
              as: 'item',
              cond: { $gt: ['$$item.date', new Date().getTime() - 1000 * 60 * 60 * 24] },
            },
          },
        },
      },
    ]);

    let currencies = [];
    for (let i = 0; i < coinMetadata.length; i++) {
      const { name, icon, graph, ticker } = coinMetadata[i];

      // match prices
      const { history: pricesFromCoin } = prices.find((i) => i.ticker === ticker + 'EUR');
      currencies.push({
        name,
        icon,
        graph,
        ticker,
        previous_price: parseFloat(pricesFromCoin[0].price),
        price: parseFloat(pricesFromCoin[pricesFromCoin.length - 1].price),
      });
    }

    _currencies = currencies;
    console.log('currencies have been updated');
  } catch (err) {
    console.log(err);
  }
}

// Average time = 460ms (with minimal data)
// This function will update all the leaderboards for every pool. This may not
// be quick enough when having a ton of players and pools but for now this will
// do nicely.
// * It's a mess..
async function updateLeaderboards() {
  try {
    const _tempLeaderboards = {};
    const pools = await models.Pool.find();
    for (let i = 0; i < pools.length; i++) {
      const pool = pools[i];

      // Find all the assets in the pool.
      let assets = (
        await models.Asset.find({
          pool: pool._id,
        }).lean()
      ).map((i) => {
        const currency = _currencies.find((j) => j.ticker === i.ticker);
        i.amount_euro = i.amount * currency.price;
        return i;
      });

      // Find all the participants.
      const participants = await models.Participant.find({});

      // Calculate the sum of the assets (per pool) per user.
      let leaderboards = {};
      for (let j = 0; j < assets.length; j++) {
        const asset = assets[j];

        if (!leaderboards[pool._id]) leaderboards[pool._id] = {};
        if (!leaderboards[pool._id][asset.user])
          leaderboards[pool._id][asset.user] = {
            assets: 0,
          };

        // Find the participant.
        const participant = participants.find((i) => i.user === String(asset.user) && i.pool === String(pool._id));
        leaderboards[pool._id][asset.user].balance = participant.balance;
        leaderboards[pool._id][asset.user].assets += asset.amount_euro;
      }

      // Add to global leaderboard variable where keys are the pool identifier
      // and values are an array with the leaderboard for the respective pool.
      const userIds = Object.keys(leaderboards[pool._id]);
      const users = await models.User.find({
        _id: {
          $in: userIds,
        },
      });
      userIds.forEach((userId) => {
        const { username } = users.find((i) => String(i._id) === userId);
        const data = leaderboards[pool._id][userId];

        if (!_tempLeaderboards[pool._id]) _tempLeaderboards[pool._id] = [];
        _tempLeaderboards[pool._id].push({
          username,
          ...data,
          total: data.assets + data.balance,
        });
      });

      // Finally loop through all the leaderboards and sort them.
      const poolIds = Object.keys(_tempLeaderboards);
      poolIds.forEach((poolId) => {
        _tempLeaderboards[poolId].sort((a, b) => b.total - a.total);
      });

      _leaderboards = _tempLeaderboards;
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  getCurrencies: () => _currencies,
  getLeaderboard: (pool_id) => _leaderboards[pool_id],
};
