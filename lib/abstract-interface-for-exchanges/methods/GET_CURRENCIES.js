module.exports = {


  friendlyName: 'Get currencies',


  description: 'Get a list of all currencies traded on this exchange.',


  // Only relevant for 'serial' argin style:
  args: ['{*}'],


  inputs: {

    apiKey: require('../PARAMETERS').apiKey,

    secret: require('../PARAMETERS').secret,

    uid: require('../PARAMETERS').uid,

    password: require('../PARAMETERS').password

  },


  exits: {

    success: {
      outputFriendlyName: 'Currencies',
      outputType: ['string'],
      outputExample: ['BTC', 'ETH', 'USD', 'LTC', 'BCH'],
      outputDescription: 'A list of the currency codes for all tradeable currencies on this exchange.',
      extendedDescription:
`A currency is considered "tradeable" if it is available on any market (no matter if it's the "base"
or the "quote"-- to privateer, it's all the same.)`,
    }

  }

};

