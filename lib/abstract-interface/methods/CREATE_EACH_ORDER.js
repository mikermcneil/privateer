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
      extendedDescription:
`Each item must include:
  - symbol
    - The **fully-normalized**, exchange-agnostic symbol string like 'btcusd'.
      Note that this means it msut be standardized to match privateer\'s format and abbreviations.  Currently as of 2017, this is exactly the same as the way the Bitfinex API does it.)
  - side
    - Either 'buy' or 'sell', depending on which you want.
      Choose 'buy' if you want the numerator ("base") currency in exchange for the denominator currency.
      Otherwise choose 'sell' if you want the denominator ("quote") currency in exchange for the numerator currency.
  - amount
    - The order size; i.e. how much you want to buy or sell.
      This is... oh god this is confusing
  - price
    - The price to buy or sell at
`,
      type: [{}],
      example: [
        {
          symbol: 'btcusd', // The **fully-normalized** name of the symbol (must be normalized for all exchanges)
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
  }

};

