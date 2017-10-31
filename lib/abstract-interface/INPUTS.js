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
    description: 'One of your developer API keys for this exchange.',
    whereToGet: { description: 'Log in to the exchange\'s website or app to access this data.' }
  },

  secret: {
    type: 'string',
    protect: true,
    description: 'The developer secret that corresponds with the specified API key.',
    extendedDescription: 'Only relevant for certain exchanges, and only if an API key was provided.',
    whereToGet: { description: 'Log in to the exchange\'s website or app to access this data.' }
  },

  passphrase: {
    type: 'string',
    protect: true,
    description: 'The relevant "passphrase" for your account on this exchange.',
    extendedDescription: 'Only relevant for certain exchanges (e.g. GDAX).'
  }

};
