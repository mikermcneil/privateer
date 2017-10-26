module.exports = {


  friendlyName: 'Create each order',


  description: 'Submit multiple new orders using the batch create API.',


  moreInfoUrl: 'https://docs.bitfinex.com/v1/reference#rest-auth-multiple-new-orders',


  inputs: {

    apiKey: require('./private/INPUTS').apiKey,

    secret: require('./private/INPUTS').secret,

    orders: {
      description: 'The new orders to be created.',
      example: [{}],
      required: true
      // e.g.
      // ```
      // [
      //   {
      //     symbol: 'btcusd', // The name of the symbol from the Bitfinex list
      //     amount: 0.02, // Order size: how much you want to buy or sell
      //     price: 0.03, // Price to buy or sell at
      //     side: 'buy', // Either 'buy' or 'sell'
      //     type: 'market' // Either 'market' / 'stop' / 'trailing-stop' / 'fill-or-kill'
      //   }
      // ]
      // ```
    }
  },


  exits: {
    success: {
      outputDescription: 'An array of order summaries.',
      outputExample: [
        {
          id: '448383729',
          symbol: 'btcusd',
          price: '0.03'
        }
      ]
    }
  },


  fn: async function (inputs, exits) {

    var _ = require('@sailshq/lodash');
    var Bitfinex = require('../');

    // Make sure each order has the 'exchange' property.
    _.each(inputs.orders, (order)=>{
      order.exchange = 'bitfinex';
    });

    var data = await Bitfinex.sendAuthenticatedRequest({
      apiKey: inputs.apiKey,
      secret: inputs.secret,
      url: '/v1/order/new/multi',
      data: {
        orders: inputs.orders
      }
    });

    // `data` is an array of bitfinex "order objects".
    // e.g.
    // ```
    // [
    //   {
    //     id: 448383729,
    //     symbol: 'btcusd',
    //     exchange: 'bitfinex',
    //     price: '0.03',
    //     avg_execution_price: '0.0',
    //     side: 'buy',
    //     type: 'market',
    //     timestamp: '1444274013.661297306',
    //     is_live: true,
    //     is_cancelled: false,
    //     is_hidden: false,
    //     was_forced: false,
    //     original_amount: '0.02',
    //     remaining_amount: '0.02',
    //     executed_amount: '0.0'
    //   }
    // ]
    // ```

    return exits.success(_.map(data, (summary)=>{
      return _.pick(summary, ['id', 'symbol', 'price']);
    }));

  }

};

