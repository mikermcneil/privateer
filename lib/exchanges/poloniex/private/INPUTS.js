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
    description: 'One of your Poloniex developer API keys.',
    whereToGet: { url: 'https://poloniex.com/apiKeys' }
  },

  secret: {
    type: 'string',
    protect: true,
    description: 'One of your Poloniex developer secrets.',
    whereToGet: { url: 'https://poloniex.com/apiKeys' }
  }
};
