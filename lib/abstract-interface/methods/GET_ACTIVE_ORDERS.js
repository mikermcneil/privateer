module.exports = {


  friendlyName: 'Get active orders',


  description: 'List all of your active ("live") orders on the exchange.',


  inputs: {

    apiKey: require('../INPUTS').apiKey,

    secret: require('../INPUTS').secret,

    password: require('../INPUTS').password,

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

    missingCredential: require('../EXCEPTIONS').missingCredential

  }

};

