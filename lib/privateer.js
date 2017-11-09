/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var ccxt = require('ccxt');
var machine = require('machine');
var PRIVATEER_PACKAGE_JSON = require('../package.json');


/**
 * Module constants
 */

var ALL_ABSTRACT_DEFS_BY_IDENTITY = [
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
    ccxtId: 'bitfinex2',
    moreInfoUrl: 'https://www.bitfinex.com',
    apiCredentials: ['apiKey', 'secret'],
    apiCredentialsUrl: 'https://bitfinex.com/api',
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // There are also a couple of other options; e.g.
    // ```
    // onlySupportsMethods: ['…'],
    // extraMethods: {
    //   sendAuthenticatedRequest: { fn: function(){ throw new Error('FUTURE (maybe… but prbly not now that we have ccxt in here)'); } }
    // }
    // ```
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  },
  bittrex: {
    friendlyName: 'Bittrex',
    ccxtId: 'bittrex',
    moreInfoUrl: 'https://bittrex.com',
    apiCredentials: ['apiKey', 'secret'],
    apiCredentialsUrl: 'https://bittrex.com/Manage#sectionApi',
  },
  hitbtc: {
    friendlyName: 'HitBTC',
    ccxtId: 'hitbtc2',
    moreInfoUrl: 'https://hitbtc.com',
    apiCredentials: ['apiKey', 'secret'],
    apiCredentialsUrl: 'https://hitbtc.com/settings/api-keys',
  },
  poloniex: {
    friendlyName: 'Poloniex',
    ccxtId: 'poloniex',
    moreInfoUrl: 'https://poloniex.com',
    apiCredentials: ['apiKey', 'secret'],
    apiCredentialsUrl: 'https://poloniex.com/apiKeys',
  },
  gdax: {
    friendlyName: 'GDAX (Coinbase)',
    ccxtId: 'gdax',
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

  // Look up exchange.
  var exchangeInfo = SUPPORTED_EXCHANGES_BY_SLUG[exchange];
  if (!exchangeInfo) {
    throw new Error('"'+exchange+'" is not a supported exchange.');
  }

  // Hydrate method implementations using closure scope
  // (pulling from baseline generic, ccxt-based implementation)
  var implementations = {
    cancelEachOrder: async function(inputs, exits) {
      var ccxtExchange = new ccxt[exchangeInfo.ccxtId]();

      // Check & configure API credentials.
      for (let credentialKind of exchangeInfo.apiCredentials) {
        if (!inputs[credentialKind]) {
          throw {missingCredential:credentialKind};
        } else {
          ccxtExchange[credentialKind] = inputs[credentialKind];
        }
      }//∞

      // ```
      // for (let id of inputs.orderIds) {
      //   cancelOrder (id[, symbol[, params]])
      // }
      // ```

      // TODO: replace with real stuff
      return exits.success([
        {
          id: '448383729',
          operation: 'btc»usd',
          sell: '0.02'
        }
      ]);
    },
    createEachOrder: async function(inputs, exits) {
      var ccxtExchange = new ccxt[exchangeInfo.ccxtId]();

      // Check & configure API credentials.
      for (let credentialKind of exchangeInfo.apiCredentials) {
        if (!inputs[credentialKind]) {
          throw {missingCredential:credentialKind};
        } else {
          ccxtExchange[credentialKind] = inputs[credentialKind];
        }
      }//∞

      // ```
      // for (let order of orders) {
      //   let symbol;// TODO: adjust symbol
      //   createMarketSellOrder (symbol, order.sell, [, params])
      // }
      // ```

      // TODO: replace with real stuff
      return exits.success([
        {
          id: '448383729',
          operation: 'btc»usd',
          sell: '0.02'
        }
      ]);
    },
    getActiveOrders: async function(inputs, exits) {
      var ccxtExchange = new ccxt[exchangeInfo.ccxtId]();

      // Check & configure API credentials.
      for (let credentialKind of exchangeInfo.apiCredentials) {
        if (!inputs[credentialKind]) {
          throw {missingCredential:credentialKind};
        } else {
          ccxtExchange[credentialKind] = inputs[credentialKind];
        }
      }//∞

      // ```
      // fetchOpenOrders ([symbol[, params]])
      // ```
      var activeOrders = await ccxtExchange.fetchOpenOrders();
      // console.log('**',openOrders);
      // // TODO: replace with real stuff
      // return exits.success([
      //   {
      //     id: '448383729',
      //     operation: 'btc»usd',
      //     sell: '0.02'
      //   }
      // ]);

      return exits.success(activeOrders);
    },
    getExchangeRates: async function(inputs, exits) {
      var ccxtExchange = new ccxt[exchangeInfo.ccxtId]();

      // ```
      // .loadMarkets()
      // ```
      // -and-
      // ```
      // .fetchTicker ('BTC/USD')
      // ```

      // > Conceptual docs re: symbols and market ids in ccxt:
      // > https://github.com/ccxt/ccxt/wiki/Manual#symbols-and-market-ids
      var markets = await ccxtExchange.loadMarkets();
      console.log(`
//  ╔╦╗╔═╗╦═╗╦╔═╔═╗╔╦╗╔═╗
//  ║║║╠═╣╠╦╝╠╩╗║╣  ║ ╚═╗
//  ╩ ╩╩ ╩╩╚═╩ ╩╚═╝ ╩ ╚═╝
${util.inspect(markets, {depth:null})}`);


      // var tickerData = await ccxtExchange.fetchTicker('BTC/USD');
      // console.log(`

// //  ╔╦╗╦╔═╗╦╔═╔═╗╦═╗  ╔╦╗╔═╗╔╦╗╔═╗
// //   ║ ║║  ╠╩╗║╣ ╠╦╝   ║║╠═╣ ║ ╠═╣
// //   ╩ ╩╚═╝╩ ╩╚═╝╩╚═  ═╩╝╩ ╩ ╩ ╩ ╩
// ${util.inspect(tickerData,{depth:null})}
// -----––-----––-----––-----––-----––-----––-----––-----––-----––`);



      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // TODO: now crawl the markets and piece them together, pulling in ticker data
      // var tickerData = await ccxtExchange.fetchTicker('BTC/USD');
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

      // TODO: replace with real stuff
      return exits.success({
        btc: {
          eth: '20.9264910962',
          usd: '6371.03',
          ltc: '120.918984281'
        },
        usd: {
          btc: '0.00015696049',
          eth: '0.00328040939'
        },
        ltc: {
          btc: '0.00827',
          usd: '54.60'
        }
      });
    },
    getHoldings: async function(inputs, exits) {
      var ccxtExchange = new ccxt[exchangeInfo.ccxtId]();

      // Check & configure API credentials.
      for (let credentialKind of exchangeInfo.apiCredentials) {
        if (!inputs[credentialKind]) {
          throw {missingCredential:credentialKind};
        } else {
          ccxtExchange[credentialKind] = inputs[credentialKind];
        }
      }//∞

      // ```
      // fetchBalance()
      // ```

      // TODO: replace with real stuff
      return exits.success({
        btc: '0.000053',
        eth: '13.283523',
        usd: '55.03'
      });
    }
  };

  // If `onlySupportsMethods` was specified, use that.
  // Otherwise, include all known standard methods.
  var supportedMethods = exchangeInfo.onlySupportsMethods || Object.keys(ALL_ABSTRACT_DEFS_BY_IDENTITY).map((identity)=>machine.getMethodName(identity));

  // Package it up and return it.
  return machine.pack({
    name: 'privateer(\''+exchange+'\')',
    description: 'Communicate with the '+exchangeInfo.friendlyName+' cryptocurrency exchange.',
    defs: supportedMethods.reduce((defs, methodName)=>{
      var identity = _.find(Object.keys(ALL_ABSTRACT_DEFS_BY_IDENTITY), (identity)=>identity===_.kebabCase(methodName));
      if (!identity) { throw new Error('Consistency violation: Mismatched identity and method name!'); }
      defs[identity] = Object.assign({}, ALL_ABSTRACT_DEFS_BY_IDENTITY[identity], {
        fn: implementations[methodName]
      });
      return defs;
    }, exchangeInfo.extraMethods||{})
  });

};




/**
 * .inspect()
 *
 * Return a pretty-printed explanation of what this is, for use in the REPL, etc.
 *
 * > Note: This overrides Node's default console.log() / util.inspect() behavior.
 *
 * @returns {String}
 */

Object.defineProperty(module.exports, 'inspect', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: function inspect(){
    return '-----------------------------------------\n'+
    ' privateer\n'+
    ' v'+PRIVATEER_PACKAGE_JSON.version+'\n'+
    '\n'+
    ' Supported exchanges:\n'+
    Object.keys(SUPPORTED_EXCHANGES_BY_SLUG).reduce((formatted, slug)=>formatted + '   · '+slug+'\n', '')+'\n'+
    ' Example usage:\n'+
    '   privateer(\'bitfinex\');\n'+
    '\n'+
    ' More info:\n'+
    '   https://npmjs.com/package/privateer\n'+
    '-----------------------------------------\n';
  }//ƒ
});


/**
 * .ccxt
 *
 * Expose the underlying ccxt library directly, for convenience.
 *
 * @type {Ref}
 */

Object.defineProperty(module.exports, 'ccxt', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: ccxt
});
