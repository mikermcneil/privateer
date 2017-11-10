module.exports = {


  friendlyName: 'Get active orders',


  description: 'List all of your active ("live") orders on the exchange.',


  inputs: {

    apiKey: require('../PARAMETERS').apiKey,

    secret: require('../PARAMETERS').secret,

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

