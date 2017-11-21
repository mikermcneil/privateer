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
      extendedDescription: 'Note that this only includes currencies supported by the exchange.  If an approximation cannot be determined for a particular currency, it is omitted from the mapping.  In addition, USD is _always_ included, and always equal to 1.',
      outputType: {},
      outputExample: {
        USD: 1,
        BTC: 8102.53,
        ETH: 302.48,
        LTC: 68.7209
      }
    }

  }

};

