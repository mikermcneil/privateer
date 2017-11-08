module.exports = {


  friendlyName: 'Get holdings',


  description: 'List the balances of each wallet.',


  inputs: {

    apiKey: require('../INPUTS').apiKey,

    secret: require('../INPUTS').secret,

    password: require('../INPUTS').password,

  },


  exits: {

    success: {
      outputFriendlyName: 'Holdings by currency',
      outputDescription: 'A mapping between currency codes and your available balance in each one.',
      extendedDescription: 'Note that this only includes the available balance of your holdings in "exchange" wallets.',
      outputType: {},
      outputExample: {
        btc: '0.000053',
        eth: '13.283523',
        usd: '55.03'
      }
    }

  }

};
