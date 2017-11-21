module.exports = {


  friendlyName: 'Cancel each order',


  description: 'Cancel multiple orders, either with the batch cancel API or by calling a single-cancel API endpoint multiple times.',


  // Only relevant for 'serial' argin style:
  args: ['orderIds', '{*}'],


  inputs: {

    orderIds: {
      description: 'The ids of the orders to be cancelled.',
      type: [ 'string' ],
      example: [ '448383729' ],
      required: true
    },

    apiKey: require('../PARAMETERS').apiKey,

    secret: require('../PARAMETERS').secret,

    uid: require('../PARAMETERS').uid,

    password: require('../PARAMETERS').password,

  },


  exits: {

    success: {
      description: 'Orders were cancelled successfully.'
    },

    missingCredentials: require('../EXCEPTIONS').missingCredentials

  }

};

