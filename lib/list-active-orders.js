module.exports = {


  friendlyName: 'List active orders',


  description: 'List all of your active ("live") orders on the exchange.',


  moreInfoUrl: 'https://docs.bitfinex.com/v1/reference#rest-auth-active-orders',


  inputs: {

    apiKey: require('./private/INPUTS').apiKey,

    secret: require('./private/INPUTS').secret,

  },


  exits: {
    success: {
      outputDescription: 'An array of your active orders.',
      outputExample: [{}]
    }
  },


  fn: async function (inputs, exits) {

    var _ = require('@sailshq/lodash');
    var Bitfinex = require('../');

    var data = await Bitfinex.sendAuthenticatedRequest({
      apiKey: inputs.apiKey,
      secret: inputs.secret,
      url: '/v1/balances'
    });


    // `data` is an array of bitfinex wallet balance objects.
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

    return exits.success(_.filter(data, (summary)=>{
      return summary.type === 'exchange';
    }));

  }

};

