/**
 * Common input definitions that are shared by multiple files.
 *
 * @type {Dictionary}
 * @constant
 */

module.exports = {

  apiKey: {
    type: 'string',
    description: 'One of your developer API keys for this exchange.',
    extendedDescription:
`This is your public API Key and/or Token. This part is non-secret (i.e. public), and it is
included in your request header or body and sent over HTTPS in open text to identify your request.
It is often a string in Hex or Base64 encoding or an UUID identifier.`,
    moreInfoUrl: 'https://github.com/ccxt/ccxt/wiki/Manual#api-keys-setup',
    whereToGet: { description: 'Log in to the exchange\'s website or app to access this data.' }
  },

  secret: {
    type: 'string',
    protect: true,
    description: 'Your developer secret that corresponds with the specified API key.',
    extendedDescription:
`This is your private key.  Keep it secret, don't tell it to anybody.  It is used to sign your requests
locally before sending them to exchanges. The secret key does not get sent over the internet in the
request-response process and should not be published or emailed. It is used together with the nonce
to generate a cryptographically strong signature. That signature is sent with your public key to
authenticate your identity. Each request has a unique nonce and therefore a unique cryptographic
signature.`,
    moreInfoUrl: 'https://github.com/ccxt/ccxt/wiki/Manual#api-keys-setup',
    whereToGet: { description: 'Log in to the exchange\'s website or app to access this data.' }
  },

  uid: {
    type: 'string',
    protect: true,
    description: 'The appropriate "user id" or "uid" for your account on this exchange, if relevant.',
    extendedDescription:
`Some exchanges (not all of them) also expect a user id (or uid for short).  It can sometimes be
a number rather than a string-- if so, simply wrap it in quotes.  You should provide this if it
is explicitly required by your exchange. See [your exchange\'s docs](https://github.com/ccxt/ccxt/wiki/Manual#exchanges)
for details.`,
    moreInfoUrl: 'https://github.com/ccxt/ccxt/wiki/Manual#api-keys-setup',
  },

  password: {
    type: 'string',
    protect: true,
    description: 'The appropriate "password" or "passphrase" for your account on this exchange, if relevant.',
    moreInfoUrl: 'https://github.com/ccxt/ccxt/wiki/Manual#api-keys-setup',
    extendedDescription:
`Some exchanges (not all of them) also require your password/phrase for trading.  You should
provide this string if explicitly required by your exchange.  For example, for GDAX, this is
your Coinbase passphrase.  See [your exchange\'s docs](https://github.com/ccxt/ccxt/wiki/Manual#exchanges).`
  }

};
