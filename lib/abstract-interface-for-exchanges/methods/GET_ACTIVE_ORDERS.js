module.exports = {


  friendlyName: 'Get active orders',


  description: 'List all of your active ("live") orders on the exchange.',


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
      outputDescription: 'An array of order summaries describing your active ("live") orders.',
      outputType: [
        require('../TYPES').ORDER_SUMMARY
      ],
      outputExample: [
        require('../EXAMPLES').ORDER_SUMMARY
      ]
    },

    missingCredentials: require('../EXCEPTIONS').missingCredentials

  }

};

