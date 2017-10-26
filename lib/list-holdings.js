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
      outputDescription: 'An array of wallet summaries.',
      outputExample: [{}]
    }
  },


  fn: async function (inputs, exits) {

    var Bitfinex = require('../');

    var data = await Bitfinex.sendAuthenticatedRequest({
      apiKey: inputs.apiKey,
      secret: inputs.secret,
      url: 'https://api.bitfinex.com/v1/balances'
    });

    // `data` is an array of bitfinex wallet balance objects.
    // e.g.
    // ```
    // [
    //   {
    //     type: 'deposit',
    //     currency: 'btc',
    //     amount: '0.0',
    //     available: '0.0'
    //   }
    // ]
    // ```

    return exits.success(data);

  }

};

