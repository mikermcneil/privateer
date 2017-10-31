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
    description: 'Your GDAX (Coinbase) API key.',
    whereToGet: { url: 'https://gdax.com/settings/api' }
  },

  secret: {
    type: 'string',
    protect: true,
    description: 'Your GDAX (Coinbase) developer secret.',
    whereToGet: { url: 'https://gdax.com/settings/api' }
  },

  passphrase: {
    type: 'string',
    protect: true,
    description: 'Your GDAX (Coinbase) passphrase.',
    whereToGet: { url: 'https://gdax.com/settings/api' }
  }

};
