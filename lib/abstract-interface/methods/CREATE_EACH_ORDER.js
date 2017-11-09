module.exports = {


  friendlyName: 'Create each order',


  description: 'Submit multiple new orders using the batch create API.',


  inputs: {

    orders: {
      required: true,
      description: 'The new orders to be created.',
      extendedDescription:
`Each order includes:
  - operation
    - A one-way representation of the currencies involved in this order, such as 'btc»eth'.
      The currency to sell should be on the left-hand side, and the currency to receive in
      exchange should be on the right-hand side.  The currencies should be expressed as
      **fully-normalized**, exchange-agnostic strings like 'btc' and 'eth'.  Note that this
      means it must be standardized to match privateer's format and abbreviations, which are
      a subset of the format used by the \`ccxt\` package.
  - sell
    - The order size; i.e. how much you want to sell.
`,
      type: [
        {
          operation: 'string',
          sell: 'string'
        }
      ],
      example: [
        {
          operation: 'btc»usd',
          sell: '0.02'
        }
      ],
      custom: (orders)=>{
        var REGEXPS = require('../REGEXPS');

        for (let order of orders) {
          let pieces = order.operation.split(REGEXPS.OP_SEPARATOR);
          if (pieces.length !== 2) {
            return false;
          }
          if (!pieces[0].match(REGEXPS.CURRENCY_SLUG) || !pieces[1].match(REGEXPS.CURRENCY_SLUG)) {
            return false;
          }
        }//∞
        return true;
      }
    },

    apiKey: require('../INPUTS').apiKey,

    secret: require('../INPUTS').secret,

    password: require('../INPUTS').password

  },


  exits: {

    success: {
      outputFriendlyName: 'Order summaries',
      outputDescription: 'An array of order summaries.',
      outputType: [
        require('../TYPES').ORDER_SUMMARY
      ],
      outputExample: [
        require('../EXAMPLES').ORDER_SUMMARY
      ]
    },

    missingCredential: require('../EXCEPTIONS').missingCredential,

    // FUTURE: Maybe add something more explicit for errors like:
    // ```
    // bittrex does not have market symbol BTC/USD
    // ```

  }

};

