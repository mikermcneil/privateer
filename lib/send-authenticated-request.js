module.exports = {


  friendlyName: 'Send authenticated request',


  description: 'Format and send an authenticated request to the Bitfinex API.',


  moreInfoUrl: 'https://docs.bitfinex.com/v1/docs/rest-auth',


  inputs: {

    apiKey: require('./private/INPUTS').apiKey,

    secret: require('./private/INPUTS').secret,

    url: {
      description: 'The url for the bitfinex endpoint.',
      example: '/v1/order/new/multi',
      required: true
    },

    data: {
      description: 'The request params.',
      example: {},
      defaultsTo: {}
      // e.g.
      // ```
      // {
      //   orders: [{...}]
      // }
      // ```
    }
  },


  exits: {

    success: {
      outputDescription: 'The parsed response body from the server.',
      outputExample: '*',
    }

  },


  fn: async function (inputs, exits) {

    var crypto = require('crypto');
    var _ = require('@sailshq/lodash');
    var HTTP = require('machinepack-http');

    var body = _.extend({
      request: inputs.url,
      nonce: Date.now() + ''
    }, inputs.data);

    // The payload is the body, first JSON encoded, and then encoded into Base64
    var payload = new Buffer(JSON.stringify(body)).toString('base64');

    var data = await HTTP.post({
      baseUrl: 'https://api.bitfinex.com',
      url: inputs.url,
      headers: {
        'X-BFX-APIKEY': inputs.apiKey,
        'X-BFX-PAYLOAD': payload,
        'X-BFX-SIGNATURE': crypto.createHmac('sha384', inputs.secret).update(payload).digest('hex'),
      }
    });

    return exits.success(data);

  }

};

