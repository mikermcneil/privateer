module.exports = {


  friendlyName: 'List holdings',


  description: 'List the balances of each wallet.',


  moreInfoUrl: 'https://docs.bitfinex.com/v1/reference#rest-auth-wallet-balances',


  inputs: {

    apiKey: require('./private/INPUTS').apiKey,

    secret: require('./private/INPUTS').secret,

  },


  exits: {
    success: {
      outputFriendlyName: 'Holdings by currency',
      outputDescription: 'A mapping between currency codes and your available balance in each one.',
      outputExample: {},
      extendedDescription: 'Note that this only includes the available balance of your holdings in "exchange" wallets.',
      // e.g.
      // {
      //   btc: '0.0',
      //   eth: '0.0'
      // }
    }
  },


  fn: async function (inputs, exits) {

    var _ = require('@sailshq/lodash');
    var Bitfinex = require('../');

    var resData = await Bitfinex.sendAuthenticatedRequest({
      apiKey: inputs.apiKey,
      secret: inputs.secret,
      url: '/v1/balances'
    });


    // `resData` is an array of bitfinex "wallet balance objects".
    // e.g.
    // ```
    // [
    //   {
    //     type: 'exchange',
    //     currency: 'btc',
    //     amount: '0.0',
    //     available: '0.0'
    //   }
    // ]
    // ```

    var holdingsByCurrency = _.reduce(resData, (memo, wallet)=>{
      if (memo.type === 'exchange') {
        memo[wallet.currency] = wallet.available;
        return memo;
      }
      else {
        return memo;
      }
    }, {});

    return exits.success(holdingsByCurrency);

  }

};

