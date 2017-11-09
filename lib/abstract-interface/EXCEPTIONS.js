/**
 * Common exceptions (non-success exit definitions) that are shared by multiple files.
 *
 * @type {Dictionary}
 * @constant
 */

module.exports = {

  missingCredential: {
    description: 'Missing one or more mandatory API credentials.',
    outputFriendlyName: 'Kind of credential',
    outputDescription: 'The kind of mandatory credential that is missing.',
    outputType: ['string'],
    extendedDescription: 'Note that other kinds of credentials might also be missing-- the result here is just the _first_ one that was encountered.',
  },

};
