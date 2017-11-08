/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var machine = require('machine');
var PRIVATEER_PACKAGE_JSON = require('../package.json');


/**
 * Module constants
 */

var ALL_ABSTRACT_DEFS_BY_IDENTITY = [
  // 'set-global-defaults',
  'create-each-order',
  'cancel-each-order',
  'get-active-orders',
  'get-exchange-rates',
  'get-holdings',
].reduce((defsByIdentity, identity)=>{
  var abstractDef = require('./abstract-interface/methods/'+_.snakeCase(identity).toUpperCase());
  defsByIdentity[identity] = Object.assign({}, abstractDef, { identity: identity });
  return defsByIdentity;
}, {});

var SUPPORTED_EXCHANGES_BY_SLUG = {
  bitfinex: {
    friendlyName: 'Bitfinex',
    moreInfoUrl: 'https://www.bitfinex.com',
    apiCredentials: ['apiKey', 'secret'],
    apiCredentialsUrl: 'https://bitfinex.com/api',
    supportedMethods: Object.keys(ALL_ABSTRACT_DEFS_BY_IDENTITY).map((identity)=>machine.getMethodName(identity)),
    extraMethods: {
      sendAuthenticatedRequest: function(){ throw new Error('TODO (maybe)'); }
    }
  },
  bittrex: {
    friendlyName: 'Bittrex',
    supportedMethods: Object.keys(ALL_ABSTRACT_DEFS_BY_IDENTITY).map((identity)=>machine.getMethodName(identity)),
    moreInfoUrl: 'https://bittrex.com',
    apiCredentials: ['apiKey', 'secret'],
    apiCredentialsUrl: 'https://bittrex.com/Manage#sectionApi',
  },
  hitbtc: {
    friendlyName: 'HitBTC',
    supportedMethods: [],//['set-global-defaults'],//ALL_BASIC_METHODS, // TODO: hook this up
    moreInfoUrl: 'https://hitbtc.com',
    apiCredentials: ['apiKey', 'secret'],
    apiCredentialsUrl: 'https://hitbtc.com/settings/api-keys',
  },
  poloniex: {
    friendlyName: 'Poloniex',
    supportedMethods: [],//['set-global-defaults'],//ALL_BASIC_METHODS, // TODO: hook this up
    moreInfoUrl: 'https://poloniex.com',
    apiCredentials: ['apiKey', 'secret'],
    apiCredentialsUrl: 'https://poloniex.com/apiKeys',
  },
  gdax: {
    friendlyName: 'GDAX (Coinbase)',
    supportedMethods: [],//['set-global-defaults'],//ALL_BASIC_METHODS, // TODO: hook this up
    moreInfoUrl: 'https://www.gdax.com',
    apiCredentials: ['apiKey', 'secret', 'password'],
    apiCredentialsUrl: 'https://gdax.com/settings/api',
  },
  // - - - - - - - - - - - - - - - - - - - - -
  // FUTURE: More exchanges
  // - - - - - - - - - - - - - - - - - - - - -
};



/**
 * privateer()
 *
 * Return the normalized driver integration for the specified cryptocurrency exchange.
 *
 * @param {String} exchange
 * @returns {Dictionary}
 */

module.exports = function privateer(exchange){

  var exchangeInfo = SUPPORTED_EXCHANGES_BY_SLUG[exchange];
  if (!exchangeInfo) {
    throw new Error('"'+exchange+'" is not a supported exchange.');
  }

  return machine.pack({
    name: 'privateer/'+exchange+'  ('+exchangeInfo.friendlyName+')',
    version: PRIVATEER_PACKAGE_JSON.version,
    defs: exchangeInfo.supportedMethods.reduce((defs, methodName)=>{
      var identity = _.find(Object.keys(ALL_ABSTRACT_DEFS_BY_IDENTITY), (identity)=>identity===_.kebabCase(methodName));
      if (!identity) { throw new Error('Consistency violation: Mismatched identity and method name!'); }
      defs[identity] = Object.assign({}, ALL_ABSTRACT_DEFS_BY_IDENTITY[identity], {
        fn: async function() {
          throw new Error('todo');
        }
      });
    }, exchangeInfo.extraMethods)
  });

};


/**
 * privateer.inspect()
 *
 * Return a pretty-printed explanation of what this is, for use in the REPL, etc.
 *
 * > Note: This overrides Node's default console.log() / util.inspect() behavior.
 *
 * @returns {String}
 */

module.exports.inspect = function(){
  return '-----------------------------------------\n'+
  ' privateer\n'+
  ' v'+PRIVATEER_PACKAGE_JSON.version+'\n'+
  '\n'+
  ' Supported exchanges:\n'+
  SUPPORTED_EXCHANGES_BY_SLUG.reduce((memo, exchangeInfo, slug)=>{
    memo += '   · '+slug+'\n';
    return memo;
  }, '')+
  '\n'+
  ' Example usage:\n'+
  '   privateer(\'bitfinex\');\n'+
  '\n'+
  ' More info:\n'+
  '   https://npmjs.com/package/privateer\n'+
  '-----------------------------------------\n';
};
