module.exports = {


  friendlyName: 'Create each order',


  description: 'Submit multiple new orders using the batch create API.',


  moreInfoUrl: 'https://docs.bitfinex.com/v1/reference#rest-auth-multiple-new-orders',


  inputs: {

    apiKey: require('./private/INPUTS').apiKey,

    secret: require('./private/INPUTS').secret,

    orders: {
      required: true,
      description: 'The new orders to be created.',
      type: [{}],
      example: [
        {
          symbol: 'btcusd', // The name of the symbol from the Bitfinex list
          amount: '0.02', // Order size: how much you want to buy or sell
          price: '0.03', // Price to buy or sell at
          side: 'buy', // Either 'buy' or 'sell'
        }
      ]
    }
  },


  exits: {
    success: {
      outputDescription: 'An array of order summaries.',
      outputType: [{}],
      outputExample: [
        {
          id: '448383729',
          symbol: 'btcusd',
          amount: '0.02',
          price: '0.03',
          side: 'buy'
        }
      ]
    }
  },


  fn: async function (inputs, exits) {

    var _ = require('@sailshq/lodash');
    var privateer = require('../privateer');

    // Transform orders, making sure each one has the 'exchange' and `type` properties.
    var newOrders = _.reduce(inputs.orders, (memo, originalOrder)=>{
      memo.push(_.extend(_.pick(originalOrder, ['symbol', 'amount', 'price', 'side']), {
        type: 'exchange limit',
        exchange: 'bitfinex'
      }));
      return memo;
    }, []);//∞

    // For reference, here is a reference of all of the things that we end up with:
    // ```
    // [
    //   {
    //     symbol: 'btcusd', // The name of the symbol from the Bitfinex list
    //     amount: '0.02', // Order size: how much you want to buy or sell
    //     price: '0.03', // Price to buy or sell at
    //     side: 'buy', // Either 'buy' or 'sell'
    //     type: 'market' // Either 'exchange limit', 'market' / 'stop' / 'trailing-stop' / 'fill-or-kill'
    //   }
    // ]
    // ```

    var data = await privateer('bitfinex').sendAuthenticatedRequest({
      apiKey: inputs.apiKey,
      secret: inputs.secret,
      url: '/v1/order/new/multi',
      data: {
        orders: newOrders
      }
    });

    // `data` is an array of bitfinex "order objects".
    // e.g.
    // ```
    // [
    //   {
    //     id: '448383729',
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

    var summaries = _.map(data.order_ids, (rawSummary)=>{
      return _.extend(_.pick(rawSummary, ['id', 'symbol', 'price', 'side']), {
        amount: rawSummary.original_amount
      });
    });//∞

    return exits.success(summaries);

  }

};

