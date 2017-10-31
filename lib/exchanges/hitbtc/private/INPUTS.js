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
    description: 'Your HitBTC developer API key.',
    whereToGet: { url: 'https://hitbtc.com/settings/api-keys' }
  },

  secret: {
    type: 'string',
    protect: true,
    description: 'Your HitBTC developer secret.',
    whereToGet: { url: 'https://hitbtc.com/settings/api-keys' }
  }
};
