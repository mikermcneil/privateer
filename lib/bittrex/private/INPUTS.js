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
    description: 'One of your Bittrex developer API keys.',
    whereToGet: { url: 'https://bittrex.com/Manage#sectionApi' }
  }

};
