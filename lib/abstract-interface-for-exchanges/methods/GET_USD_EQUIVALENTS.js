module.exports = {


  friendlyName: 'Get USD equivalents',


  description: 'Get a mapping between every tradeable currency on this exchange and the approximate equivalent value for 1 unit of that currency, expressed in USD.',


  // Only relevant for 'serial' argin style:
  args: ['{*}'],


  inputs: {

    apiKey: require('../PARAMETERS').apiKey,

    secret: require('../PARAMETERS').secret,

    uid: require('../PARAMETERS').uid,

    password: require('../PARAMETERS').password,

  },


  exits: {

    success: {
      outputFriendlyName: 'USD equivalent by currency',
      outputDescription: 'A mapping between currency codes and the value of 1 unit of that currency (in USD).',
      extendedDescription: 'Note that this only includes currencies supported by the exchange.',
      outputType: {},
      outputExample: {
        BTC: 8102.53,
        ETH: 302.48
      }
    }

  }

};

