/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var ccxt = require('ccxt');
var machine = require('machine');
var REGEXPS = require('./abstract-interface/REGEXPS');
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
    //   ██╗              ██╗      ██████╗ █████╗ ███╗   ██╗ ██████╗███████╗██╗
    //  ██╔╝              ╚██╗    ██╔════╝██╔══██╗████╗  ██║██╔════╝██╔════╝██║
    //  ██║     █████╗     ██║    ██║     ███████║██╔██╗ ██║██║     █████╗  ██║
    //  ██║     ╚════╝     ██║    ██║     ██╔══██║██║╚██╗██║██║     ██╔══╝  ██║
    //  ╚██╗              ██╔╝    ╚██████╗██║  ██║██║ ╚████║╚██████╗███████╗███████╗██╗██╗██╗
    //   ╚═╝              ╚═╝      ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝╚══════╝╚═╝╚═╝╚═╝
    //
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
      //  cancelOrder (id[, symbol[, params]])
      // ```
      for (let id of inputs.orderIds) {
        await ccxtExchange.cancelOrder(id);
      }//∞

      return exits.success();
    },
    //   ██╗              ██╗      ██████╗██████╗ ███████╗ █████╗ ████████╗███████╗
    //  ██╔╝      ██╗     ╚██╗    ██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔════╝
    //  ██║     ██████╗    ██║    ██║     ██████╔╝█████╗  ███████║   ██║   █████╗
    //  ██║     ╚═██╔═╝    ██║    ██║     ██╔══██╗██╔══╝  ██╔══██║   ██║   ██╔══╝
    //  ╚██╗      ╚═╝     ██╔╝    ╚██████╗██║  ██║███████╗██║  ██║   ██║   ███████╗██╗██╗██╗
    //   ╚═╝              ╚═╝      ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝╚═╝╚═╝
    //
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

      // Load all markets on this change (keyed by all available symbols)
      var markets = await ccxtExchange.loadMarkets();

      // ```
      //   createMarketSellOrder (symbol, order.sell, [, params])
      // ```
      var results = [];
      for (let order of inputs.orders) {

        // Convert from simplified order format to ccxt format
        // > e.g. from `{ operation: 'btc»usd', sell: '0.02' }`...
        // > to 'BTC/USD' (still '0.02') or 'USD/BTC' (but somehow figure out inverse price)
        let currencies = order.operation.split(REGEXPS.OP_SEPARATOR).map((currency)=>currency.toUpperCase());
        let ccxtSellSymbol = currencies.join('/');
        let ccxtBuySymbol = currencies.reverse().join('/');

        if (markets[ccxtSellSymbol]) {
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // TODO: Probably change this to do limit trades instead.
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          results.push(await ccxtExchange.createMarketSellOrder(ccxtSellSymbol, order.sell));
        } else if (markets[ccxtBuySymbol]) {
          throw new Error('Symbol flipping not implemented yet!');
          // TODO: figure out how to do this cleanly
          // let rate =
          // let amountToBuy =
          // TODO: do better math here ^^^^
          // results.push(await ccxtExchange.createMarketBuyOrder(ccxtBuySymbol, amountToBuy));
        } else {
          // TODO: use explicit error instead of trying anyway and failing
          await ccxtExchange.createMarketSellOrder(ccxtSellSymbol, order.sell);
          throw new Error('Consistency violation: It should be impossible to make it here.');
        }
      }//∞

      // - - - - - - - - - - - - - - - - - - - - - - - -
      // An error occurred:
      //
      // { Error: bittrex {"success":false,"message":"MARKET_ORDERS_DISABLED","result":null}
      //     at bittrex.request (/Users/mikermcneil/code/privateer/node_modules/ccxt/js/bittrex.js:507:15)
      //     at <anonymous>
      //     at process._tickDomainCallback (internal/process/next_tick.js:208:7) constructor: [Function: ExchangeError] }
      // - - - - - - - - - - - - - - - - - - - - - - - -

      // TODO: munge results
      return exits.success(results);

      // // TODO: replace with real stuff
      // return exits.success([
      //   {
      //     id: '448383729',
      //     operation: 'btc»usd',
      //     sell: '0.02'
      //   }
      // ]);
    },
    //   ██████╗ ███████╗████████╗     █████╗  ██████╗████████╗██╗██╗   ██╗███████╗
    //  ██╔════╝ ██╔════╝╚══██╔══╝    ██╔══██╗██╔════╝╚══██╔══╝██║██║   ██║██╔════╝
    //  ██║  ███╗█████╗     ██║       ███████║██║        ██║   ██║██║   ██║█████╗
    //  ██║   ██║██╔══╝     ██║       ██╔══██║██║        ██║   ██║╚██╗ ██╔╝██╔══╝
    //  ╚██████╔╝███████╗   ██║       ██║  ██║╚██████╗   ██║   ██║ ╚████╔╝ ███████╗██╗██╗██╗
    //   ╚═════╝ ╚══════╝   ╚═╝       ╚═╝  ╚═╝ ╚═════╝   ╚═╝   ╚═╝  ╚═══╝  ╚══════╝╚═╝╚═╝╚═╝
    //
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

      // e.g.
      // [ { info: { …raw stuff from exchange… }
      //     id: '0da4b34e-bb89-4d57-a749-c650b55e02b0',
      //     timestamp: 1510204571310,
      //     datetime: '2017-11-09T05:16:11.310Z',
      //     symbol: 'ETC/BTC',
      //     type: 'limit',
      //     side: 'buy',
      //     price: 0.00192001,
      //     cost: 0.0005087250047955999,
      //     average: undefined,
      //     amount: 0.26495956,
      //     filled: 0,
      //     remaining: 0.26495956,
      //     status: 'open',
      //     fee: { cost: 0, currency: 'BTC' } } ]


      // Format orders
      activeOrders = activeOrders.map((ccxtOrder)=>{

        let currencies = ccxtOrder.symbol.split(REGEXPS.CCXT_SYMBOL_SEPARATOR).map((currency)=>currency.toLowerCase());

        var op;
        var amtToSell;
        if (ccxtOrder.side === 'sell') {
          op = currencies.join('»');
          amtToSell = String(ccxt.amount);
        } else if (ccxtOrder.side === 'buy') {
          op = currencies.reverse().join('»');
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // TODO: do a symbol flip to get the amount to sell based on market rates
          // ```
          // amtToSell = String(…);
          // ```
          throw new Error('Symbol flipping not implemented yet');
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        } else {
          throw new Error(`ccxt sent back an order with an unexpected .side: ${ccxtOrder.side}`);
        }

        return {
          id: ccxtOrder.id,
          operation: op,
          sell: amtToSell
        };
      });//≈ (∞)

      return exits.success(activeOrders);
    },
    //   ██████╗ ███████╗████████╗      ██████╗  █████╗ ████████╗███████╗███████╗
    //  ██╔════╝ ██╔════╝╚══██╔══╝      ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔════╝
    //  ██║  ███╗█████╗     ██║         ██████╔╝███████║   ██║   █████╗  ███████╗
    //  ██║   ██║██╔══╝     ██║         ██╔══██╗██╔══██║   ██║   ██╔══╝  ╚════██║
    //  ╚██████╔╝███████╗   ██║██╗██╗██╗██║  ██║██║  ██║   ██║   ███████╗███████║
    //   ╚═════╝ ╚══════╝   ╚═╝╚═╝╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝
    //
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
      // var markets = await ccxtExchange.loadMarkets();
      // console.log(`${util.inspect(markets, {depth:null})}`);

      var tickerData = await ccxtExchange.fetchTicker('BTC/USD');
      // console.log(`${util.inspect(tickerData,{depth:null})`}


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
    //   ██████╗ ███████╗████████╗      ██╗  ██╗ ██████╗ ██╗     ██████╗ ██╗███╗   ██╗ ██████╗ ███████╗
    //  ██╔════╝ ██╔════╝╚══██╔══╝      ██║  ██║██╔═══██╗██║     ██╔══██╗██║████╗  ██║██╔════╝ ██╔════╝
    //  ██║  ███╗█████╗     ██║         ███████║██║   ██║██║     ██║  ██║██║██╔██╗ ██║██║  ███╗███████╗
    //  ██║   ██║██╔══╝     ██║         ██╔══██║██║   ██║██║     ██║  ██║██║██║╚██╗██║██║   ██║╚════██║
    //  ╚██████╔╝███████╗   ██║██╗██╗██╗██║  ██║╚██████╔╝███████╗██████╔╝██║██║ ╚████║╚██████╔╝███████║
    //   ╚═════╝ ╚══════╝   ╚═╝╚═╝╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝
    //
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
      var holdings = await ccxtExchange.fetchBalance();
      // e.g.
      // {"info":[{"Currency":"BTC","Balance":0.00099001,"Available":0.00099001,"Pending":0,"CryptoAddress":"1Jc9ftGtnJJdCLSunXWi1cteMvkn8jLP5d"},{"Currency":"ETC","Balance":0.26495956,"Available":0.26495956,"Pending":0,"CryptoAddress":null}],"LTC":{"free":0,"used":0,"total":0},"DOGE":{"free":0,"used":0,"total":0},"VTC":{"free":0,"used":0,"total":0},"PPC":{"free":0,"used":0,"total":0},"FTC":{"free":0,"used":0,"total":0},"RDD":{"free":0,"used":0,"total":0},"NXT":{"free":0,"used":0,"total":0},"DASH":{"free":0,"used":0,"total":0},"POT":{"free":0,"used":0,"total":0},"BLK":{"free":0,"used":0,"total":0},"EMC2":{"free":0,"used":0,"total":0},"XMY":{"free":0,"used":0,"total":0},"AUR":{"free":0,"used":0,"total":0},"EFL":{"free":0,"used":0,"total":0},"GLD":{"free":0,"used":0,"total":0},"SLR":{"free":0,"used":0,"total":0},"PTC":{"free":0,"used":0,"total":0},"GRS":{"free":0,"used":0,"total":0},"NLG":{"free":0,"used":0,"total":0},"RBY":{"free":0,"used":0,"total":0},"XWC":{"free":0,"used":0,"total":0},"MONA":{"free":0,"used":0,"total":0},"THC":{"free":0,"used":0,"total":0},"ENRG":{"free":0,"used":0,"total":0},"ERC":{"free":0,"used":0,"total":0},"VRC":{"free":0,"used":0,"total":0},"CURE":{"free":0,"used":0,"total":0},"XMR":{"free":0,"used":0,"total":0},"CLOAK":{"free":0,"used":0,"total":0},"START":{"free":0,"used":0,"total":0},"KORE":{"free":0,"used":0,"total":0},"XDN":{"free":0,"used":0,"total":0},"TRUST":{"free":0,"used":0,"total":0},"NAV":{"free":0,"used":0,"total":0},"XST":{"free":0,"used":0,"total":0},"BTCD":{"free":0,"used":0,"total":0},"VIA":{"free":0,"used":0,"total":0},"PINK":{"free":0,"used":0,"total":0},"IOC":{"free":0,"used":0,"total":0},"CANN":{"free":0,"used":0,"total":0},"SYS":{"free":0,"used":0,"total":0},"NEOS":{"free":0,"used":0,"total":0},"DGB":{"free":0,"used":0,"total":0},"BURST":{"free":0,"used":0,"total":0},"EXCL":{"free":0,"used":0,"total":0},"SWIFT":{"free":0,"used":0,"total":0},"DOPE":{"free":0,"used":0,"total":0},"BLOCK":{"free":0,"used":0,"total":0},"ABY":{"free":0,"used":0,"total":0},"BYC":{"free":0,"used":0,"total":0},"XMG":{"free":0,"used":0,"total":0},"BLITZ":{"free":0,"used":0,"total":0},"BAY":{"free":0,"used":0,"total":0},"BTS":{"free":0,"used":0,"total":0},"FAIR":{"free":0,"used":0,"total":0},"SPR":{"free":0,"used":0,"total":0},"VTR":{"free":0,"used":0,"total":0},"XRP":{"free":0,"used":0,"total":0},"GAME":{"free":0,"used":0,"total":0},"COVAL":{"free":0,"used":0,"total":0},"NXS":{"free":0,"used":0,"total":0},"XCP":{"free":0,"used":0,"total":0},"BITB":{"free":0,"used":0,"total":0},"GEO":{"free":0,"used":0,"total":0},"FLDC":{"free":0,"used":0,"total":0},"GRC":{"free":0,"used":0,"total":0},"FLO":{"free":0,"used":0,"total":0},"NBT":{"free":0,"used":0,"total":0},"MUE":{"free":0,"used":0,"total":0},"XEM":{"free":0,"used":0,"total":0},"CLAM":{"free":0,"used":0,"total":0},"DMD":{"free":0,"used":0,"total":0},"GAM":{"free":0,"used":0,"total":0},"SPHR":{"free":0,"used":0,"total":0},"OK":{"free":0,"used":0,"total":0},"SNRG":{"free":0,"used":0,"total":0},"PKB":{"free":0,"used":0,"total":0},"CPC":{"free":0,"used":0,"total":0},"AEON":{"free":0,"used":0,"total":0},"ETH":{"free":0,"used":0,"total":0},"GCR":{"free":0,"used":0,"total":0},"TX":{"free":0,"used":0,"total":0},"BCY":{"free":0,"used":0,"total":0},"EXP":{"free":0,"used":0,"total":0},"INFX":{"free":0,"used":0,"total":0},"OMNI":{"free":0,"used":0,"total":0},"AMP":{"free":0,"used":0,"total":0},"AGRS":{"free":0,"used":0,"total":0},"XLM":{"free":0,"used":0,"total":0},"BTC":{"free":0.00099001,"used":0,"total":0.00099001},"CLUB":{"free":0,"used":0,"total":0},"VOX":{"free":0,"used":0,"total":0},"EMC":{"free":0,"used":0,"total":0},"FCT":{"free":0,"used":0,"total":0},"MAID":{"free":0,"used":0,"total":0},"EGC":{"free":0,"used":0,"total":0},"SLS":{"free":0,"used":0,"total":0},"RADS":{"free":0,"used":0,"total":0},"DCR":{"free":0,"used":0,"total":0},"SAFEX":{"free":0,"used":0,"total":0},"BSD":{"free":0,"used":0,"total":0},"XVG":{"free":0,"used":0,"total":0},"PIVX":{"free":0,"used":0,"total":0},"XVC":{"free":0,"used":0,"total":0},"MEME":{"free":0,"used":0,"total":0},"STEEM":{"free":0,"used":0,"total":0},"2GIVE":{"free":0,"used":0,"total":0},"LSK":{"free":0,"used":0,"total":0},"PDC":{"free":0,"used":0,"total":0},"BRK":{"free":0,"used":0,"total":0},"DGD":{"free":0,"used":0,"total":0},"WAVES":{"free":0,"used":0,"total":0},"RISE":{"free":0,"used":0,"total":0},"LBC":{"free":0,"used":0,"total":0},"SBD":{"free":0,"used":0,"total":0},"BRX":{"free":0,"used":0,"total":0},"ETC":{"free":0.26495956,"used":0,"total":0.26495956},"STRAT":{"free":0,"used":0,"total":0},"UNB":{"free":0,"used":0,"total":0},"SYNX":{"free":0,"used":0,"total":0},"TRIG":{"free":0,"used":0,"total":0},"EBST":{"free":0,"used":0,"total":0},"VRM":{"free":0,"used":0,"total":0},"SEQ":{"free":0,"used":0,"total":0},"XAUR":{"free":0,"used":0,"total":0},"SNGLS":{"free":0,"used":0,"total":0},"REP":{"free":0,"used":0,"total":0},"SHIFT":{"free":0,"used":0,"total":0},"ARDR":{"free":0,"used":0,"total":0},"XZC":{"free":0,"used":0,"total":0},"NEO":{"free":0,"used":0,"total":0},"ZEC":{"free":0,"used":0,"total":0},"ZCL":{"free":0,"used":0,"total":0},"IOP":{"free":0,"used":0,"total":0},"GOLOS":{"free":0,"used":0,"total":0},"UBQ":{"free":0,"used":0,"total":0},"KMD":{"free":0,"used":0,"total":0},"GBG":{"free":0,"used":0,"total":0},"SIB":{"free":0,"used":0,"total":0},"ION":{"free":0,"used":0,"total":0},"LMC":{"free":0,"used":0,"total":0},"QWARK":{"free":0,"used":0,"total":0},"CRW":{"free":0,"used":0,"total":0},"SWT":{"free":0,"used":0,"total":0},"TIME":{"free":0,"used":0,"total":0},"MLN":{"free":0,"used":0,"total":0},"ARK":{"free":0,"used":0,"total":0},"DYN":{"free":0,"used":0,"total":0},"TKS":{"free":0,"used":0,"total":0},"MUSIC":{"free":0,"used":0,"total":0},"DTB":{"free":0,"used":0,"total":0},"INCNT":{"free":0,"used":0,"total":0},"GBYTE":{"free":0,"used":0,"total":0},"GNT":{"free":0,"used":0,"total":0},"NXC":{"free":0,"used":0,"total":0},"EDG":{"free":0,"used":0,"total":0},"LGD":{"free":0,"used":0,"total":0},"TRST":{"free":0,"used":0,"total":0},"WINGS":{"free":0,"used":0,"total":0},"RLC":{"free":0,"used":0,"total":0},"GNO":{"free":0,"used":0,"total":0},"GUP":{"free":0,"used":0,"total":0},"LUN":{"free":0,"used":0,"total":0},"APX":{"free":0,"used":0,"total":0},"TKN":{"free":0,"used":0,"total":0},"HMQ":{"free":0,"used":0,"total":0},"ANT":{"free":0,"used":0,"total":0},"SC":{"free":0,"used":0,"total":0},"BAT":{"free":0,"used":0,"total":0},"ZEN":{"free":0,"used":0,"total":0},"1ST":{"free":0,"used":0,"total":0},"QRL":{"free":0,"used":0,"total":0},"CRB":{"free":0,"used":0,"total":0},"PTOY":{"free":0,"used":0,"total":0},"MYST":{"free":0,"used":0,"total":0},"CFI":{"free":0,"used":0,"total":0},"BNT":{"free":0,"used":0,"total":0},"NMR":{"free":0,"used":0,"total":0},"SNT":{"free":0,"used":0,"total":0},"DCT":{"free":0,"used":0,"total":0},"XEL":{"free":0,"used":0,"total":0},"MCO":{"free":0,"used":0,"total":0},"ADT":{"free":0,"used":0,"total":0},"FUN":{"free":0,"used":0,"total":0},"PAY":{"free":0,"used":0,"total":0},"MTL":{"free":0,"used":0,"total":0},"STORJ":{"free":0,"used":0,"total":0},"ADX":{"free":0,"used":0,"total":0},"OMG":{"free":0,"used":0,"total":0},"CVC":{"free":0,"used":0,"total":0},"PART":{"free":0,"used":0,"total":0},"QTUM":{"free":0,"used":0,"total":0},"BCH":{"free":0,"used":0,"total":0},"DNT":{"free":0,"used":0,"total":0},"ADA":{"free":0,"used":0,"total":0},"MANA":{"free":0,"used":0,"total":0},"SALT":{"free":0,"used":0,"total":0},"TIX":{"free":0,"used":0,"total":0},"RCN":{"free":0,"used":0,"total":0},"VIB":{"free":0,"used":0,"total":0},"USDT":{"free":0,"used":0,"total":0},"free":{"LTC":0,"DOGE":0,"VTC":0,"PPC":0,"FTC":0,"RDD":0,"NXT":0,"DASH":0,"POT":0,"BLK":0,"EMC2":0,"XMY":0,"AUR":0,"EFL":0,"GLD":0,"SLR":0,"PTC":0,"GRS":0,"NLG":0,"RBY":0,"XWC":0,"MONA":0,"THC":0,"ENRG":0,"ERC":0,"VRC":0,"CURE":0,"XMR":0,"CLOAK":0,"START":0,"KORE":0,"XDN":0,"TRUST":0,"NAV":0,"XST":0,"BTCD":0,"VIA":0,"PINK":0,"IOC":0,"CANN":0,"SYS":0,"NEOS":0,"DGB":0,"BURST":0,"EXCL":0,"SWIFT":0,"DOPE":0,"BLOCK":0,"ABY":0,"BYC":0,"XMG":0,"BLITZ":0,"BAY":0,"BTS":0,"FAIR":0,"SPR":0,"VTR":0,"XRP":0,"GAME":0,"COVAL":0,"NXS":0,"XCP":0,"BITB":0,"GEO":0,"FLDC":0,"GRC":0,"FLO":0,"NBT":0,"MUE":0,"XEM":0,"CLAM":0,"DMD":0,"GAM":0,"SPHR":0,"OK":0,"SNRG":0,"PKB":0,"CPC":0,"AEON":0,"ETH":0,"GCR":0,"TX":0,"BCY":0,"EXP":0,"INFX":0,"OMNI":0,"AMP":0,"AGRS":0,"XLM":0,"BTC":0.00099001,"CLUB":0,"VOX":0,"EMC":0,"FCT":0,"MAID":0,"EGC":0,"SLS":0,"RADS":0,"DCR":0,"SAFEX":0,"BSD":0,"XVG":0,"PIVX":0,"XVC":0,"MEME":0,"STEEM":0,"2GIVE":0,"LSK":0,"PDC":0,"BRK":0,"DGD":0,"WAVES":0,"RISE":0,"LBC":0,"SBD":0,"BRX":0,"ETC":0.26495956,"STRAT":0,"UNB":0,"SYNX":0,"TRIG":0,"EBST":0,"VRM":0,"SEQ":0,"XAUR":0,"SNGLS":0,"REP":0,"SHIFT":0,"ARDR":0,"XZC":0,"NEO":0,"ZEC":0,"ZCL":0,"IOP":0,"GOLOS":0,"UBQ":0,"KMD":0,"GBG":0,"SIB":0,"ION":0,"LMC":0,"QWARK":0,"CRW":0,"SWT":0,"TIME":0,"MLN":0,"ARK":0,"DYN":0,"TKS":0,"MUSIC":0,"DTB":0,"INCNT":0,"GBYTE":0,"GNT":0,"NXC":0,"EDG":0,"LGD":0,"TRST":0,"WINGS":0,"RLC":0,"GNO":0,"GUP":0,"LUN":0,"APX":0,"TKN":0,"HMQ":0,"ANT":0,"SC":0,"BAT":0,"ZEN":0,"1ST":0,"QRL":0,"CRB":0,"PTOY":0,"MYST":0,"CFI":0,"BNT":0,"NMR":0,"SNT":0,"DCT":0,"XEL":0,"MCO":0,"ADT":0,"FUN":0,"PAY":0,"MTL":0,"STORJ":0,"ADX":0,"OMG":0,"CVC":0,"PART":0,"QTUM":0,"BCH":0,"DNT":0,"ADA":0,"MANA":0,"SALT":0,"TIX":0,"RCN":0,"VIB":0,"USDT":0},"used":{"LTC":0,"DOGE":0,"VTC":0,"PPC":0,"FTC":0,"RDD":0,"NXT":0,"DASH":0,"POT":0,"BLK":0,"EMC2":0,"XMY":0,"AUR":0,"EFL":0,"GLD":0,"SLR":0,"PTC":0,"GRS":0,"NLG":0,"RBY":0,"XWC":0,"MONA":0,"THC":0,"ENRG":0,"ERC":0,"VRC":0,"CURE":0,"XMR":0,"CLOAK":0,"START":0,"KORE":0,"XDN":0,"TRUST":0,"NAV":0,"XST":0,"BTCD":0,"VIA":0,"PINK":0,"IOC":0,"CANN":0,"SYS":0,"NEOS":0,"DGB":0,"BURST":0,"EXCL":0,"SWIFT":0,"DOPE":0,"BLOCK":0,"ABY":0,"BYC":0,"XMG":0,"BLITZ":0,"BAY":0,"BTS":0,"FAIR":0,"SPR":0,"VTR":0,"XRP":0,"GAME":0,"COVAL":0,"NXS":0,"XCP":0,"BITB":0,"GEO":0,"FLDC":0,"GRC":0,"FLO":0,"NBT":0,"MUE":0,"XEM":0,"CLAM":0,"DMD":0,"GAM":0,"SPHR":0,"OK":0,"SNRG":0,"PKB":0,"CPC":0,"AEON":0,"ETH":0,"GCR":0,"TX":0,"BCY":0,"EXP":0,"INFX":0,"OMNI":0,"AMP":0,"AGRS":0,"XLM":0,"BTC":0,"CLUB":0,"VOX":0,"EMC":0,"FCT":0,"MAID":0,"EGC":0,"SLS":0,"RADS":0,"DCR":0,"SAFEX":0,"BSD":0,"XVG":0,"PIVX":0,"XVC":0,"MEME":0,"STEEM":0,"2GIVE":0,"LSK":0,"PDC":0,"BRK":0,"DGD":0,"WAVES":0,"RISE":0,"LBC":0,"SBD":0,"BRX":0,"ETC":0,"STRAT":0,"UNB":0,"SYNX":0,"TRIG":0,"EBST":0,"VRM":0,"SEQ":0,"XAUR":0,"SNGLS":0,"REP":0,"SHIFT":0,"ARDR":0,"XZC":0,"NEO":0,"ZEC":0,"ZCL":0,"IOP":0,"GOLOS":0,"UBQ":0,"KMD":0,"GBG":0,"SIB":0,"ION":0,"LMC":0,"QWARK":0,"CRW":0,"SWT":0,"TIME":0,"MLN":0,"ARK":0,"DYN":0,"TKS":0,"MUSIC":0,"DTB":0,"INCNT":0,"GBYTE":0,"GNT":0,"NXC":0,"EDG":0,"LGD":0,"TRST":0,"WINGS":0,"RLC":0,"GNO":0,"GUP":0,"LUN":0,"APX":0,"TKN":0,"HMQ":0,"ANT":0,"SC":0,"BAT":0,"ZEN":0,"1ST":0,"QRL":0,"CRB":0,"PTOY":0,"MYST":0,"CFI":0,"BNT":0,"NMR":0,"SNT":0,"DCT":0,"XEL":0,"MCO":0,"ADT":0,"FUN":0,"PAY":0,"MTL":0,"STORJ":0,"ADX":0,"OMG":0,"CVC":0,"PART":0,"QTUM":0,"BCH":0,"DNT":0,"ADA":0,"MANA":0,"SALT":0,"TIX":0,"RCN":0,"VIB":0,"USDT":0},"total":{"LTC":0,"DOGE":0,"VTC":0,"PPC":0,"FTC":0,"RDD":0,"NXT":0,"DASH":0,"POT":0,"BLK":0,"EMC2":0,"XMY":0,"AUR":0,"EFL":0,"GLD":0,"SLR":0,"PTC":0,"GRS":0,"NLG":0,"RBY":0,"XWC":0,"MONA":0,"THC":0,"ENRG":0,"ERC":0,"VRC":0,"CURE":0,"XMR":0,"CLOAK":0,"START":0,"KORE":0,"XDN":0,"TRUST":0,"NAV":0,"XST":0,"BTCD":0,"VIA":0,"PINK":0,"IOC":0,"CANN":0,"SYS":0,"NEOS":0,"DGB":0,"BURST":0,"EXCL":0,"SWIFT":0,"DOPE":0,"BLOCK":0,"ABY":0,"BYC":0,"XMG":0,"BLITZ":0,"BAY":0,"BTS":0,"FAIR":0,"SPR":0,"VTR":0,"XRP":0,"GAME":0,"COVAL":0,"NXS":0,"XCP":0,"BITB":0,"GEO":0,"FLDC":0,"GRC":0,"FLO":0,"NBT":0,"MUE":0,"XEM":0,"CLAM":0,"DMD":0,"GAM":0,"SPHR":0,"OK":0,"SNRG":0,"PKB":0,"CPC":0,"AEON":0,"ETH":0,"GCR":0,"TX":0,"BCY":0,"EXP":0,"INFX":0,"OMNI":0,"AMP":0,"AGRS":0,"XLM":0,"BTC":0.00099001,"CLUB":0,"VOX":0,"EMC":0,"FCT":0,"MAID":0,"EGC":0,"SLS":0,"RADS":0,"DCR":0,"SAFEX":0,"BSD":0,"XVG":0,"PIVX":0,"XVC":0,"MEME":0,"STEEM":0,"2GIVE":0,"LSK":0,"PDC":0,"BRK":0,"DGD":0,"WAVES":0,"RISE":0,"LBC":0,"SBD":0,"BRX":0,"ETC":0.26495956,"STRAT":0,"UNB":0,"SYNX":0,"TRIG":0,"EBST":0,"VRM":0,"SEQ":0,"XAUR":0,"SNGLS":0,"REP":0,"SHIFT":0,"ARDR":0,"XZC":0,"NEO":0,"ZEC":0,"ZCL":0,"IOP":0,"GOLOS":0,"UBQ":0,"KMD":0,"GBG":0,"SIB":0,"ION":0,"LMC":0,"QWARK":0,"CRW":0,"SWT":0,"TIME":0,"MLN":0,"ARK":0,"DYN":0,"TKS":0,"MUSIC":0,"DTB":0,"INCNT":0,"GBYTE":0,"GNT":0,"NXC":0,"EDG":0,"LGD":0,"TRST":0,"WINGS":0,"RLC":0,"GNO":0,"GUP":0,"LUN":0,"APX":0,"TKN":0,"HMQ":0,"ANT":0,"SC":0,"BAT":0,"ZEN":0,"1ST":0,"QRL":0,"CRB":0,"PTOY":0,"MYST":0,"CFI":0,"BNT":0,"NMR":0,"SNT":0,"DCT":0,"XEL":0,"MCO":0,"ADT":0,"FUN":0,"PAY":0,"MTL":0,"STORJ":0,"ADX":0,"OMG":0,"CVC":0,"PART":0,"QTUM":0,"BCH":0,"DNT":0,"ADA":0,"MANA":0,"SALT":0,"TIX":0,"RCN":0,"VIB":0,"USDT":0}}


      // Send back `holdings.free`, the mapping of currently available funds by currency.
      return exits.success(holdings.free);

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
