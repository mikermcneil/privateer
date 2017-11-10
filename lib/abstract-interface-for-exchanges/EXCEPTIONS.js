/**
 * Common exceptions (non-success exit definitions) that are shared by multiple files.
 *
 * @type {Dictionary}
 * @constant
 */

module.exports = {

  missingCredentials: {
    description: 'Missing one or more mandatory API credentials.',
    outputFriendlyName: 'Missing credentials',
    outputDescription: 'The kinds of mandatory credentials that are missing.',
    outputType: ['string'],
    outputExample: ['secret', 'uid']
  },

};
