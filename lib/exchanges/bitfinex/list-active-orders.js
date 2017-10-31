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
      outputDescription: 'An array of your active ("live") orders.',
      outputType: [{}]
    }
  },


  fn: async function (inputs, exits) {

    var _ = require('@sailshq/lodash');
    var privateer = require('../../privateer');

    var resData = await privateer('bitfinex').sendAuthenticatedRequest({
      apiKey: inputs.apiKey,
      secret: inputs.secret,
      url: '/v1/orders'
    });

    var summaries = _.map(resData, (rawSummary)=>{
      return _.extend(_.pick(rawSummary, ['id', 'symbol', 'price', 'side']), {
        amount: rawSummary.original_amount
      });
    });//∞

    return exits.success(summaries);

  }

};

