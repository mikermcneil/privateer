module.exports = {


  friendlyName: 'Get holdings',


  description: 'List the balances of each wallet.',


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
      outputFriendlyName: 'Holdings by currency',
      outputDescription: 'A mapping between currency codes and your available balance in each one.',
      extendedDescription: 'Note that this only includes the available balance of your holdings in "exchange" wallets.',
      outputType: {},
      outputExample: {
        BTC: 0.000053,
        ETH: 13.283523,
        USD: 55.03
      }
    },

    missingCredentials: require('../EXCEPTIONS').missingCredentials

  }

};

