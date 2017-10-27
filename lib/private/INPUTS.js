/**
 * Common input definitions that are shared by multiple machines
 *
 * @type {Dictionary}
 * @constant
 */

module.exports = {

  apiKey: {
    type: 'string',
    protect: true,
    description: 'Your Bitfinex developer API key.',
    whereToGet: { url: 'https://bitfinex.com/api' }
  },

  secret: {
    type: 'string',
    protect: true,
    description: 'Your Bitfinex developer secret.',
    whereToGet: { url: 'https://bitfinex.com/api' }
  }
};
