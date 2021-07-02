/**
 * This script can be run to insert metadata from the support currencies.
 */

const models = require('../models');
const axios = require('axios');
const database = require('../database');

database.once('open', async () => {
  try {
    const tickers = (await models.Coin.find({}, 'ticker').lean().exec()).map((i) => i.ticker.replace('EUR', ''));

    const {
      data: {
        data: { cryptoCurrencyList: currencies },
      },
    } = await axios.get(
      'https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=1&limit=500&sortBy=market_cap&sortType=desc&convert=USD,BTC,ETH&cryptoType=all&tagType=all&audited=false&aux=ath,atl,high24h,low24h,num_market_pairs,cmc_rank,date_added,tags,platform,max_supply,circulating_supply,total_supply,volume_7d,volume_30d'
    );

    for (let i = 0; i < currencies.length; i++) {
      const currency = currencies[i];

      if (tickers.includes(currency.symbol)) {
        // insert metadta from this
        const model = new models.CoinMetadata({
          name: currency.name,
          icon: `https://s2.coinmarketcap.com/static/img/coins/64x64/${currency.id}.png`,
          graph: `https://s3.coinmarketcap.com/generated/sparklines/web/7d/usd/${currency.id}.png`,
          ticker: currency.symbol,
        });

        await model.save();
      }
    }
  } catch (err) {
    console.log(err);
  }
});
