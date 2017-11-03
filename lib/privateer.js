/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var machine = require('machine');
var PRIVATEER_PACKAGE_JSON = require('../package.json');


/**
 * Module constants
 */

var ALL_BASIC_METHODS = [
  'set-global-defaults',
  'create-each-order',
  'cancel-each-order',
  'get-active-orders',
  'get-exchange-rates',
  'get-holdings',
];

var SUPPORTED_EXCHANGES_BY_SLUG = {
  bitfinex: {
    friendlyName: 'Bitfinex',
    supportedMethods: ALL_BASIC_METHODS.concat('send-authenticated-request'),
    moreInfoUrl: 'https://www.bitfinex.com',
    apiCredentials: ['apiKey', 'secret'],
    apiCredentialsUrl: 'https://bitfinex.com/api',
  },
  bittrex: {
    friendlyName: 'Bittrex',
    supportedMethods: ALL_BASIC_METHODS,
    moreInfoUrl: 'https://bittrex.com',
    apiCredentials: ['apiKey', 'secret'],
    apiCredentialsUrl: 'https://bittrex.com/Manage#sectionApi',
  },
  hitbtc: {
    friendlyName: 'HitBTC',
    supportedMethods: ['set-global-defaults'],//ALL_BASIC_METHODS, // TODO: hook this up
    moreInfoUrl: 'https://hitbtc.com',
    apiCredentials: ['apiKey', 'secret'],
    apiCredentialsUrl: 'https://hitbtc.com/settings/api-keys',
  },
  poloniex: {
    friendlyName: 'Poloniex',
    supportedMethods: ['set-global-defaults'],//ALL_BASIC_METHODS, // TODO: hook this up
    moreInfoUrl: 'https://poloniex.com',
    apiCredentials: ['apiKey', 'secret'],
    apiCredentialsUrl: 'https://poloniex.com/apiKeys',
  },
  gdax: {
    friendlyName: 'GDAX (Coinbase)',
    supportedMethods: ['set-global-defaults'],//ALL_BASIC_METHODS, // TODO: hook this up
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

  throw new Error('new way not fully implemented yet!');// TODO

  // NEWEST WAY:
  // ---------------------------------
  // TODO: this one -- it's the cleanest and has the least potential complications / ambiguities
  // for future debugging scenarios.  It's also just as terse as the others without needing to
  // invent new concepts.
  machine.pack({
    name: 'privateer  (for the '+exchangeInfo.friendlyName+' exchange)',
    version: PRIVATEER_PACKAGE_JSON.version,
    methods: {
      cancelEachOrder: _.extend({}, require('./abstract-interface/methods/CANCEL_EACH_ORDER'), {
        fn: function(inputs, exits) {
          throw new Error('todo');
        }
      }),
    },
  });

  // // NEWERER WAY:
  // // ---------------------------------
  // machine.pack({
  //   name: 'privateer  (for the '+exchangeInfo.friendlyName+' exchange)',
  //   version: PRIVATEER_PACKAGE_JSON.version,
  //   srcDirectory: path.resolve(__dirname, './exchanges/'+exchange),
  //   methods: {
  //     cancelEachOrder: machine.implement({
  //       interface: require('./abstract-interface/methods/CANCEL_EACH_ORDER'),
  //       overrides: { identity: 'cancel-each-order' },
  //       fn: function(inputs, exits) {
  //         throw new Error('todo');
  //       }
  //     })
  //   },
  // });


  // // NEWER WAY:
  // // ---------------------------------
  // machine.pack({
  //   name: 'privateer  (for the '+exchangeInfo.friendlyName+' exchange)',
  //   version: PRIVATEER_PACKAGE_JSON.version,
  //   methods: {
  //     cancelEachOrder: machine.implement({
  //       interface: require('./abstract-interface/methods/CANCEL_EACH_ORDER'),
  //       overrides: { identity: 'cancel-each-order' },
  //       fn: function(inputs, exits) {
  //         throw new Error('todo');
  //       }
  //     })
  //   },
  // });


  // OLD WAY:
  // ---------------------------------
  // ```
  return machine.pack({
    dir: __dirname,
    pkg: {
      name: 'privateer  (for the '+exchangeInfo.friendlyName+' exchange)',
      version: PRIVATEER_PACKAGE_JSON.version,
      machinepack: {
        friendlyName: exchangeInfo.friendlyName,
        machineDir: './exchanges/'+exchange,
        machines: exchangeInfo.supportedMethods
      }
    }
  });
  // ```

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
  _.reduce(SUPPORTED_EXCHANGES_BY_SLUG, (memo, exchangeInfo, slug)=>{
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
