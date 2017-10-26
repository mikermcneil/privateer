module.exports = {


  friendlyName: 'Cancel each order',


  description: 'Cancel multiple orders using the batch cancel API.',


  moreInfoUrl: 'https://docs.bitfinex.com/v1/reference#rest-auth-cancel-multiple-orders',


  inputs: {

    apiKey: require('./private/INPUTS').apiKey,

    secret: require('./private/INPUTS').secret,

    orderIds: {
      description: 'The ids of the orders to be cancelled.',
      example: [448383729],
      required: true
    }
  },


  exits: {

    success: {
      description: 'Orders were cancelled successfully.'
    }

  },


  fn: async function (inputs, exits) {

    var Bitfinex = require('../');

    await Bitfinex.sendAuthenticatedRequest({
      apiKey: inputs.apiKey,
      secret: inputs.secret,
      url: '/v1/order/cancel/multi',
      data: {
        order_ids: inputs.orderIds
      }
    });

    return exits.success();

  }

};

