/**
 * Common input definitions that are shared by multiple files.
 *
 * @type {Dictionary}
 * @constant
 */

module.exports = {

  apiKey: {
    type: 'string',
    protect: true,
    description: 'One of your Bitfinex developer API keys.',
    whereToGet: { url: 'https://bitfinex.com/api' }
  },

  secret: {
    type: 'string',
    protect: true,
    description: 'One of your Bitfinex developer secrets.',
    whereToGet: { url: 'https://bitfinex.com/api' }
  }
};
