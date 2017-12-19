/////////////////////////////////////////////////////////////////////////////////////
// ENTRY POINT
(function _checkingNodeVersion(){
  var semver = require('semver');
  var PJ = require('../package.json');
  if (!semver.satisfies(semver.clean(process.version), PJ.engines.node)) {
    throw new Error(
      'Sorry, `'+PJ.name+'` isn\'t compatible with your currently-installed '+
      'version of Node.js ('+process.version+').  To use this package, please '+
      'install a compatible version of Node.js ('+PJ.engines.node+').'
    );
  }
})();
/////////////////////////////////////////////////////////////////////////////////////


/**
 * Module dependencies
 */

var util = require('util');
var fs = require('fs');
var path = require('path');
var _ = require('@sailshq/lodash');
var ccxt = require('ccxt');
var chalk = require('chalk');
var flaverr = require('flaverr');
var httpx = require('machinepack-http');
var machine = require('machine');
var parley = require('parley');
var REGEXPS = require('./abstract-interface-for-exchanges/REGEXPS');
var PRIVATEER_PACKAGE_JSON = require('../package.json');
var getCurrencies = require('./private/get-currencies');



/**
 * Module constants
 */

var ALL_ABSTRACT_DEFS_BY_IDENTITY;
{
  let abstractMethodsDir = path.resolve(__dirname, './abstract-interface-for-exchanges/methods/');
  ALL_ABSTRACT_DEFS_BY_IDENTITY = fs.readdirSync(abstractMethodsDir).reduce((defsByIdentity, filename)=>{
    let filePath = path.resolve(abstractMethodsDir, filename);
    let abstractDef = require(filePath);
    let identity = _.kebabCase(path.basename(filePath, path.extname(filePath))).toLowerCase();
    defsByIdentity[identity] = Object.assign({}, abstractDef, { identity: identity });
    return defsByIdentity;
  }, {});
}//∫


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// NOTE
//
// I.  Selling means:
//   • you're creating an "ask", a type of offer
//
//   • the "amount" is the # of goods (# of BASE units) you're
//     willing to part with (i.e. amount available for sale)
//
//   • the limit is the **minimum unit price**-- that is, the
//     minimum # of QUOTE units you'd accept per 1 BASE unit sold.
//
// II. Buying means:
//   • you're creating a "bid", a type of offer
//
//   • the "amount" is the # of goods (# of BASE units) you want
//     (i.e. amount you're interested in purchasing)
//
//   • the limit is the **maximum unit price**-- that is, the
//     maximum # of QUOTE you'd pay per 1 BASE unit.
//
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// For example, consider this fantasy fiat market:
//
// USD/GBP  ($/£)
//
// base:  $ (dollar)
// quote: £ (pound sterling)
//
//
// Order book:
// ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
// desire:     qty:      unit price:
// ··········  ·······   ··················
// buy         $19       (bid 3  £ per $1)
// sell        $4        (ask 38 £ per $1)
// sell        $83       (ask 41 £ per $1)
// buy         $2        (bid 12 £ per $1)
// ___________________________________________
//
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Remember these two equations:
//
// • qtyX * priceYperX = qtyY
//   (^Quantity times unit price equals how much money you receive or spend.)
//
// • 1/priceYPerX = priceXPerY
//   (^Dollars per rupee is the inverse of rupee per dollars.)
//
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// For example, given:
// • 40 rupees
// • 0.05 dollar(s) per rupee
//
// [1] If I'm selling/buying 40 rupees for dollars at that asking price, then I
// how many dollars do I receive/pay in total?
// (The answer is $2, given by `qtyX * priceYperX = qtyY`.)
//
// [2] Now what if I was selling/buying 40 dollars for rupees at the inverse price
// (1/0.05===20) of 20 rupees per dollar?  How many rupees would I receive/pay?
// (The answer is 800 rupees, given by `1/priceYPerX = priceXPerY`.)
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Now, as far as integrations, it'd be simplest just to do:
// ```
//   createMarketSellOrder (symbol, order.subtract, [, params])
// ```
// ...but market orders aren't supported for some exchanges.
// (e.g. bitfinex blocking them for US customers, or the mysterious
// "MARKET_ORDERS_DISABLED" error on bittrex.)
//
// So we do limit orders instead, using ccxt's:
// ```
//   createLimitSellOrder (symbol, amount, price[, params])
// ```
//
// > For more information, see:
// > https://github.com/ccxt/ccxt/wiki/Manual#symbols-and-market-ids
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// > Note: Seems like, at least for some exchanges like bittrex, anything AT ALL
// > unusual (even the price being "too high", e.g. 999 BTC) can cause errors.
// > And oftentimes those errors don't make a ton of sense (e.g. if the price is
// > too high, you seem to get "ZERO_OR_NEGATIVE_NOT_ALLOWED").
//
// > BITTREX errors:   (e.g. ZERO_OR_NEGATIVE_NOT_ALLOWED)
// > https://support.bittrex.com/hc/en-us/articles/115000240791-Error-Codes-Troubleshooting-common-error-codes
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



// Build a mapping of exchange info, indexed by slug
// https://github.com/ccxt/ccxt/wiki/Manual#exchanges
var SUPPORTED_EXCHANGES_BY_SLUG = _.reduce(ccxt.exchanges, (supportedExchangesBySlug, ccxtId)=>{

  // Determine exchange slug.
  var slug = ccxtId;

  // Ignore "v2" APIs (provided there's a v1)
  if (_.endsWith(ccxtId, '2')) {
    if (_.contains(ccxt.exchanges, ccxtId.replace(/2$/, ''))) {
      // Avast and continue to next exchange
      return supportedExchangesBySlug;
    }
    else {
      // No v1 equivalent exists, so go ahead and allow this through as-is.
      // (We continue below.)
    }
  }

  // Ignore "_"-prefixed exchanges altogether
  if (_.startsWith(ccxtId, '_')) {
    // Avast and continue to next exchange
    return supportedExchangesBySlug;
  }//•

  var ccxtExchange = new ccxt[ccxtId]();

  // Catalog exchange info.
  supportedExchangesBySlug[slug] = {
    friendlyName: ccxtExchange.name,
    ccxtId: ccxtId,
    moreInfoUrl: _.isArray(ccxtExchange.urls.www)? ccxtExchange.urls.www[0]||'' : ccxtExchange.urls.www,
    apiCredentials: ['apiKey', 'secret', 'uid', 'password']
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // ^^FUTURE: possibly be smarter about this and only allow credentials
    // that the exchange actually supports.  ccxt doesn't provide this info
    // atm though, so we'd have to hard-code it
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  };

  return supportedExchangesBySlug;
}, {});


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// For example, here's which API credentials you need for 5 major
// exchanges, and the URL where you can obtain that information:
//
// Bitfinex
// • mandatory credentials : ['apiKey', 'secret'],
// • where to get          : 'https://bitfinex.com/api',
//
// Bittrex
// • mandatory credentials : ['apiKey', 'secret'],
// • where to get          : 'https://bittrex.com/Manage#sectionApi',
//
// HitBTC
// • mandatory credentials : ['apiKey', 'secret'],
// • where to get          : 'https://hitbtc.com/settings/api-keys',
//
// Poloniex
// • mandatory credentials : ['apiKey', 'secret'],
// • where to get          : 'https://poloniex.com/apiKeys',
//
// GDAX
// • mandatory credentials : ['apiKey', 'secret', 'password'],
// • where to get          : 'https://gdax.com/settings/api',
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


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
    if (_.endsWith(exchange, '2')) {
      throw new Error('"'+exchange+'" is not a supported exchange. (Maybe try it without the "2" on the end!)');
    } else {
      throw new Error('"'+exchange+'" is not a supported exchange.');
    }
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
      // {// Check API credentials.
      //   let missing = _.difference(exchangeInfo.apiCredentials, _.keys(inputs));
      //   if (missing.length > 0) {
      //     throw {missingCredentials:missing};
      //   }
      // }//∫
      // ^^FUTURE: potentially bring that back

      // Initialize and configure exchange.
      var ccxtExchange = Object.assign(new ccxt[exchangeInfo.ccxtId](), _.pick(inputs, exchangeInfo.apiCredentials));

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
      // {// Check API credentials.
      //   let missing = _.difference(exchangeInfo.apiCredentials, _.keys(inputs));
      //   if (missing.length > 0) {
      //     throw {missingCredentials:missing};
      //   }
      // }//∫
      // ^^FUTURE: potentially bring that back

      // Initialize and configure exchange.
      var ccxtExchange = Object.assign(new ccxt[exchangeInfo.ccxtId](), _.pick(inputs, exchangeInfo.apiCredentials));

      // Load all markets on this change (keyed by all available symbols)
      var markets = await ccxtExchange.loadMarkets();

      var results = [];
      for (let order of inputs.orders) {

        // Convert from operation into the proper ccxt symbol
        // > e.g. from `{ operation: 'BTC->USD', subtract: '0.02' }`...
        // > to 'BTC/USD' (still '0.02') or 'USD/BTC' (the inverse price)
        // > The numerator (BASE) currency is for measuring units of goods,
        // > while the denominator (QUOTE) currency is used for measuring prices.
        let currencies = order.operation.split(REGEXPS.OP_SEPARATOR);

        let ccxtMarketSymbolForSelling = currencies.join('/');
        let ccxtMarketSymbolForBuying = _.clone(currencies).reverse().join('/');

        if (markets[ccxtMarketSymbolForSelling] && markets[ccxtMarketSymbolForBuying]) {
          // FUTURE: If this dual symbol case ever turns out to ever be a thing, come
          // in here and handle it at that time.  (It seems like it'd be a pretty weird
          // thing though.)
          throw new Error(`Consistency violation: Somehow, this exchange has redundant markets (both ${ccxtMarketSymbolForSelling} and ${ccxtMarketSymbolForBuying})`);
        } else if (!markets[ccxtMarketSymbolForSelling] && !markets[ccxtMarketSymbolForBuying]) {
          throw new Error(`This exchange doesn\'t support ${order.operation} (it has neither ${ccxtMarketSymbolForSelling} nor ${ccxtMarketSymbolForBuying} markets.)`);
        }

        let marketAction = markets[ccxtMarketSymbolForSelling]?'sell':'buy';
        let marketSymbol = (marketAction === 'sell'? ccxtMarketSymbolForSelling : ccxtMarketSymbolForBuying);
        let baseCurrency = (marketAction === 'sell'? currencies[0] : currencies[1]);
        let quoteCurrency = (marketAction === 'sell'? currencies[1] : currencies[0]);

        // Hit the exchange to look up a reasonable ask/bid unit price for our order.
        let ticker = await ccxtExchange.fetchTicker(marketSymbol);
        // e.g.
        // ```
        // ticker { symbol: 'ETC/BTC',
        //   timestamp: 1510625908720,
        //   datetime: '2017-11-14T02:18:28.720Z',
        //   high: 0.0026062,  ««-- **probably of interest**
        //   low: 0.00220088,  ««-- **probably of interest**
        //   bid: 0.00259999,  ««-- **probably of interest**
        //   ask: 0.0026,      ««-- **probably of interest**
        //   vwap: undefined,
        //   open: undefined,
        //   close: undefined,
        //   first: undefined,
        //   last: 0.00259999,
        //   change: undefined,
        //   percentage: undefined,
        //   average: undefined,
        //   baseVolume: 989226.27597898,
        //   quoteVolume: 2382.05039143,
        //   info:
        //    { MarketName: 'BTC-ETC',
        //      High: 0.0026062,
        //      Low: 0.00220088,
        //      Volume: 989226.27597898,
        //      Last: 0.00259999,
        //      BaseVolume: 2382.05039143,
        //      TimeStamp: '2017-11-14T02:18:28.72',
        //      Bid: 0.00259999,
        //      Ask: 0.0026,
        //      OpenBuyOrders: 1751,
        //      OpenSellOrders: 8058,
        //      PrevDay: 0.00257807,
        //      Created: '2016-07-26T18:10:22.82' } }
        //   ```

        let unitPriceLimitInQuotePerBase = (
          marketAction === 'sell'?
          // Minimum acceptable ask to make:   (note: for something really crazy, use 99999)
          ticker.ask
          :
          // Maximum acceptable bid to make:   (note: for something really crazy, use 0.0005)
          ticker.bid
        );
        // ^This represents either the min ask or the max bid (expressed in QUOTE per BASE)

        let qtyBaseUnits = (
          marketAction === 'sell'?
          order.subtract
          :
          // numtobuy*price = quotecurrencyspent
          (order.subtract / unitPriceLimitInQuotePerBase)//qtyBoughtX * unitPricePer1X = qtySpentY
          // ^^TODO: use safer math
        );


        console.log(
          '\n'+
          '|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯\n'+
          '| '+order.operation+'   (dumping '+chalk.yellow(order.subtract+' '+currencies[0])+')   \n'+
          '|________________________________________________________________________\n'+
          '| Implementation:\n'+
          '| \n'+
          '| We\'ll create a '+chalk.black.bold[marketAction==='sell'?'bgRed':'bgGreen'](marketAction.toUpperCase())+' order on the '+marketSymbol+ ' market.\n'+
          '| · # units:     '+chalk[marketAction==='sell'?'yellow':'blue'](qtyBaseUnits+' '+baseCurrency)+chalk.gray('  (qty base units to '+marketAction+')\n')+
          '| · unit price:  '+(marketAction==='sell'?'at least ':'up to ')+unitPriceLimitInQuotePerBase+' '+quoteCurrency+' per 1 '+baseCurrency+chalk.gray('  (quote to '+(marketAction==='sell'?'ask':'bid')+' per base)\n')+
          '|\n'+
          '| In other words, we\'re saying:\n'+
          '| '+
              (
                marketAction==='sell'?
                'In total, I want to get paid at least'
                :
                'In total, I\'m prepared to pay someone up to'
              )+' '+
              (
                chalk[marketAction==='sell'?'blue':'yellow']((qtyBaseUnits*unitPriceLimitInQuotePerBase)+' '+quoteCurrency)+' for '+
                (marketAction==='sell'?'these ':'')+
                chalk[marketAction==='sell'?'yellow':'blue'](qtyBaseUnits+' '+baseCurrency)
              )+'.\n'+
          '°'
        );


        let ccxtResData;
        // e.g.
        // ```
        // [ { info:
        //      { success: true,
        //        message: '',
        //        result: { uuid: '8f610ae6-1add-4d7a-bf08-14836e667330' } },
        //     id: '8f610ae6-1add-4d7a-bf08-14836e667330' } ]
        // ```

        try {
          if (marketAction === 'sell') {
            ccxtResData = await ccxtExchange.createLimitSellOrder(marketSymbol, qtyBaseUnits, unitPriceLimitInQuotePerBase);
          } else {
            ccxtResData = await ccxtExchange.createLimitBuyOrder(marketSymbol, qtyBaseUnits, unitPriceLimitInQuotePerBase);
          }
        } catch (err) {
          // Prevent stack trace getting "cliffed out" at the tick
          throw flaverr.wrap({ raw: flaverr.getBareTrace(err, 2) }, err);
        }

        results.push({
          id: ccxtResData.id,
          operation: order.operation,
          subtract: order.subtract,
          // Advisory info (for debugging)
          _info: {
            summary: 'Created '+ (marketAction === 'sell'? 'ASK order (selling '+currencies[0]+')' : 'BID order (buying '+currencies[1]+')') + ' in the '+marketSymbol+ ' market.',
            marketAction: marketAction,
            marketSymbol: marketSymbol,
            [marketAction === 'sell' ? 'minAskUnitPrice' : 'maxBidUnitPrice']: unitPriceLimitInQuotePerBase + ` ${quoteCurrency} per unit ${baseCurrency}`,
            marketBaseCurrency: baseCurrency,
            marketQuoteCurrency: quoteCurrency
          }
        });

      }//∞

      return exits.success(results);
    },
    //   ██████╗ ███████╗████████╗     █████╗  ██████╗████████╗██╗██╗   ██╗███████╗
    //  ██╔════╝ ██╔════╝╚══██╔══╝    ██╔══██╗██╔════╝╚══██╔══╝██║██║   ██║██╔════╝
    //  ██║  ███╗█████╗     ██║       ███████║██║        ██║   ██║██║   ██║█████╗
    //  ██║   ██║██╔══╝     ██║       ██╔══██║██║        ██║   ██║╚██╗ ██╔╝██╔══╝
    //  ╚██████╔╝███████╗   ██║       ██║  ██║╚██████╗   ██║   ██║ ╚████╔╝ ███████╗██╗██╗██╗
    //   ╚═════╝ ╚══════╝   ╚═╝       ╚═╝  ╚═╝ ╚═════╝   ╚═╝   ╚═╝  ╚═══╝  ╚══════╝╚═╝╚═╝╚═╝
    //
    getActiveOrders: async function(inputs, exits) {
      // {// Check API credentials.
      //   let missing = _.difference(exchangeInfo.apiCredentials, _.keys(inputs));
      //   if (missing.length > 0) {
      //     throw {missingCredentials:missing};
      //   }
      // }//∫
      // ^^FUTURE: potentially bring that back

      // Initialize and configure exchange.
      var ccxtExchange = Object.assign(new ccxt[exchangeInfo.ccxtId](), _.pick(inputs, exchangeInfo.apiCredentials));

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

        // Parse out currencies from the trading symbol.
        let currencies = ccxtOrder.symbol.split(REGEXPS.CCXT_SYMBOL_SEPARATOR);

        var op;
        var amtBaseToSubtract;
        if (ccxtOrder.side === 'sell') {
          op = currencies.join('->');
          amtBaseToSubtract = ccxtOrder.amount;
        } else if (ccxtOrder.side === 'buy') {
          op = _.clone(currencies).reverse().join('->');
          amtBaseToSubtract = ccxtOrder.amount*ccxtOrder.price;// TODO: safer math
        } else {
          throw new Error(`ccxt sent back an order with an unexpected .side: ${ccxtOrder.side}`);
        }

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // FUTURE: probably also return:
        //  • if it's partially filled, how much much was already filled (`filledSoFar`)
        //    Otherwise, set `filledSoFar: 0`.
        //  • and possibly also how much remains unfilled (though that bit isn't really necessary)
        //
        // For now though, userland code can work around this by "trickling" smaller orders
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        return {
          id: ccxtOrder.id,
          operation: op,
          subtract: amtBaseToSubtract
        };
      });//≈ (∞)

      return exits.success(activeOrders);
    },
    //   ██████╗ ███████╗████████╗     ██████╗██╗   ██╗██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗██╗███████╗███████╗
    //  ██╔════╝ ██╔════╝╚══██╔══╝    ██╔════╝██║   ██║██╔══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██║██╔════╝██╔════╝
    //  ██║  ███╗█████╗     ██║       ██║     ██║   ██║██████╔╝██████╔╝█████╗  ██╔██╗ ██║██║     ██║█████╗  ███████╗
    //  ██║   ██║██╔══╝     ██║       ██║     ██║   ██║██╔══██╗██╔══██╗██╔══╝  ██║╚██╗██║██║     ██║██╔══╝  ╚════██║
    //  ╚██████╔╝███████╗   ██║       ╚██████╗╚██████╔╝██║  ██║██║  ██║███████╗██║ ╚████║╚██████╗██║███████╗███████║
    //   ╚═════╝ ╚══════╝   ╚═╝        ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝ ╚═════╝╚═╝╚══════╝╚══════╝
    //
    getCurrencies: async function(inputs, exits) {
      var currencies = await getCurrencies(exchangeInfo.ccxtId);
      return exits.success(currencies);
    },
    //   ██████╗ ███████╗████████╗      ██████╗  █████╗ ████████╗███████╗███████╗
    //  ██╔════╝ ██╔════╝╚══██╔══╝      ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔════╝
    //  ██║  ███╗█████╗     ██║         ██████╔╝███████║   ██║   █████╗  ███████╗
    //  ██║   ██║██╔══╝     ██║         ██╔══██╗██╔══██║   ██║   ██╔══╝  ╚════██║
    //  ╚██████╔╝███████╗   ██║██╗██╗██╗██║  ██║██║  ██║   ██║   ███████╗███████║
    //   ╚═════╝ ╚══════╝   ╚═╝╚═╝╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝
    //
    getExchangeRates: async function(inputs, exits) {

      // Initialize exchange
      // > (no need to use credentials-- this one is part of the public API)
      var ccxtExchange = new ccxt[exchangeInfo.ccxtId]();


      // ```
      // .fetchMarkets()
      // ```
      // -and-
      // ```
      // .fetchTicker(symbol)
      // ```

      // Fetch symbols (i.e. currency markets)
      // > And filter, if relevant.
      var relevantMarkets = await ccxtExchange.fetchMarkets();
      var currencies = inputs.currencies||undefined;
      if (currencies) {
        relevantMarkets = _.filter(relevantMarkets, (market)=>{
          return (_.contains(currencies, market.base) && _.contains(currencies, market.quote));
        });
      }//ﬁ
      // console.log('CURRENCIES:', currencies);
      // console.log(`${require('util').inspect(relevantMarkets, {depth:null})}`);
      // console.log(`${require('util').inspect(_.map(relevantMarkets, 'symbol'), {depth:null})}`);
      if (!_.isArray(relevantMarkets)) {
        throw new Error('ccxt\'s fetchMarkets() method returned something crazy for this exchange (`'+exchangeInfo.ccxtId+'`).  Expecting an array, but instead got:\n'+util.inspect(relevantMarkets, {depth:null})+'');
      }

      var rates = {};
      var numRequestsSinceLastBreather = 0;
      var MAX_REQUESTS_BEFORE_BREATHER = 5;
      var BREATHER_LENGTH_IN_SECONDS = 12;
      {// Now for each currency pair, catalog the current market price (in both directions).
        for (let market of relevantMarkets){
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: unroll this loop and use `.fetchTickers()` for those exchanges that
          // support the batch operation.  This would allow us to reduce the number of
          // remote calls and improve performance / decrease latency.
          //
          // https://github.com/ccxt/ccxt/wiki/Manual#all-at-once
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // --UPDATE--
          // The statement above might not be true...  It seems fetchTickers() may just
          // be using a workaround like the one implemented here.  So better to stick
          // with what we've got, I imagine, seeing as it works.
          // -m  Nov 21, 2017
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          if (numRequestsSinceLastBreather > MAX_REQUESTS_BEFORE_BREATHER) {
            // console.log('taking breather...');
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // FUTURE: Maybe call optional notifier function here
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            await parley((done)=>setTimeout(done, BREATHER_LENGTH_IN_SECONDS*1000));
            numRequestsSinceLastBreather = 0;
          }//ﬁ

          // console.log(`fetching ticker for ${market.symbol}...`);
          let ticker = await ccxtExchange.fetchTicker(market.symbol);
          numRequestsSinceLastBreather++;
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: Maybe call a SEPARATE optional notifier function here
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // console.log('ticker', ticker);

          /*Just a sanity check:  */if (rates[market.base]&&rates[market.base][market.quote]) { throw new Error('Consistency violation: Something went wrong... there should never be a case where we catalog the same unidirectional exchange rate more than once!'); }

          // Catalog the market exchange rate (measured in QUOTE per BASE)
          // > i.e. the # QUOTE you're likely to get if you sell 1 BASE
          rates[market.base] = rates[market.base]||{};
          rates[market.base][market.quote] = ticker.ask;// QUOTE per BASE
          rates[market.base][market.quote] = rates[market.base][market.quote];

          // Deduce the INVERSE market exchange rate
          // > i.e. the # BASE you're likely to be able to buy with 1 QUOTE
          rates[market.quote] = rates[market.quote]||{};
          rates[market.quote][market.base] = 1/ticker.bid;// BASE per QUOTE
          // TODO: Use safer math___________/˘^˘¯¯¯¯¯¯¯¯¯

          rates[market.quote][market.base] = rates[market.quote][market.base];
        }//∞

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // > For an analogy and deep dive on this, w/ a nonsensical example, see:
        // > https://gist.github.com/mikermcneil/797caa00986111ffe932793e3bd42965
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // Note that we use the `fetchTicker()` approach above mainly for the sake of
        // time and convenience.  Realistically, it's probably good enough (although see
        // above for an important optimization.)
        //
        // Also, for future reference:
        // To compute from raw orderbook, we could do something like this:
        // ```
        // For each ccxt trading symbol, determine the current market rates (buying & selling).
        // var marketRatesByCcxtSymbol = {
        //   'ETH/BTC': await ccxtExchange.fetchOrderBook('ETH/BTC')
        //   // …
        // };
        // console.log(`${require('util').inspect(marketRatesByCcxtSymbol, {depth:null})}`);
        // ```
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // More about market price:
        // https://github.com/ccxt/ccxt/wiki/Manual#market-price
        //
        // See also:
        //  • Conceptual docs re: symbols and market ids in ccxt:
        //      https://github.com/ccxt/ccxt/wiki/Manual#symbols-and-market-ids
        //  • This StackExchange question:
        //      https://money.stackexchange.com/a/1065
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      }//∫

      return exits.success(rates);

    },
    //   ██████╗ ███████╗████████╗    ██╗   ██╗███████╗██████╗     ███████╗ ██████╗
    //  ██╔════╝ ██╔════╝╚══██╔══╝    ██║   ██║██╔════╝██╔══██╗    ██╔════╝██╔═══██╗
    //  ██║  ███╗█████╗     ██║       ██║   ██║███████╗██║  ██║    █████╗  ██║   ██║
    //  ██║   ██║██╔══╝     ██║       ██║   ██║╚════██║██║  ██║    ██╔══╝  ██║▄▄ ██║
    //  ╚██████╔╝███████╗   ██║       ╚██████╔╝███████║██████╔╝    ███████╗╚██████╔╝██╗██╗██╗
    //   ╚═════╝ ╚══════╝   ╚═╝        ╚═════╝ ╚══════╝╚═════╝     ╚══════╝ ╚══▀▀═╝ ╚═╝╚═╝╚═╝
    //
    getUsdEquivalents: async function(inputs, exits) {

      var currencies = await getCurrencies(exchangeInfo.ccxtId);

      // Get the USD equivalents of all known currencies.
      // (This is just a rough, generic, exchange-agnostic estimate using
      // the coinmarketcap API.  It won't necessarily include all currencies forever!!
      // But if any are not found, this throws an explicit error.)
      // https://coinmarketcap.com/api/
      var coinMarketCapData = await httpx.get({
        baseUrl: 'https://api.coinmarketcap.com/v1',
        url: '/ticker/',
        data: {
          limit: 99999
        }
      });

      // Build our final result mapping by looping over all known currencies traded
      // on this exchange and grabbing the USD equivalent from the coinmarketcap data.
      // (Currencies unrecognized by coinmarketcap are omitted.)
      var approximateUsdEquivs = { USD: 1 };
      {
        for (let currency of currencies) {
          var coinMarketCapCode;
          switch (currency) {
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // Note: Not all currency codes in coinmarketcap actually translate properly to
            // currency codes in ccxt.  This is a problem, because depending on the exchange
            // you're using, some currencies just don't show up when they should.
            // Since coinmarketcap is a worst-case scenario strategy anyway, we include
            // a few common mappings here.  However, note this isn't perfect, and will
            // need to be kept up to date manually as coinmarketcap changes!!!
            //
            // Below, each case takes the form:
            // e.g.
            // >  IOT is known to coinmarketcap as "MIOTA"
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            case 'IOT': coinMarketCapCode = 'MIOTA'; break;
            case 'NBT': coinMarketCapCode = 'USNBT'; break;
            case 'STR': coinMarketCapCode = 'XLM'; break;
            case 'Bitmark': coinMarketCapCode = 'BTM'; break;
            case 'XDG': coinMarketCapCode = 'DOGE'; break;
            case 'CRS': coinMarketCapCode = 'STA'; break;
            case 'ECAT': coinMarketCapCode = 'ENG'; break;
            case 'EMGO': coinMarketCapCode = 'MGO'; break;

            // As of ccxt 1.10.236, these are the currencies that we couldn't find an equivalent code for:
            //
            // Bitfinex
            // ------------------------
            // RRT
            // CST_BCU « Bitcoin Core (Bitfinex)
            // CST_BCU « Bitcoin Unlimited (Bitfinex)
            // DAT « (Maybe Streamr?)
            //
            //
            // HitBTC
            // ------------------------
            // BUS « Bitcoin Unlimited Support
            // XDNCO
            // BQX « Bitquence
            // MRV « Macroverse
            // HRB « Harbor
            // PBKX « PBKXToken
            // PQT « PAquarium
            // 8BT « 8 Circuit Studios Token
            // IML « IMMLA
            // ROOTS « RootProject
            // GRPH « s3ntigrapH
            // BitClave
            // IGNIS « Ignis
            // ICO
            // WMGO « MobileGo on WAVES
            // MIPS « MIPSToken
            // LAT « Latium
            // EBTCOLD « eBTC Old
            // BKB « BetKing Bankroll Token
            // BMT « BMChain
            // CL « Coinlancer
            // CLD « Cloud
            // ELM « Element
            // PRE « Premine
            // CDX « Network (But could be 'NTWK' if this is the same as 'Network Token')
            // HAC « HAC Token
            // ITS
            //
            //
            // Non-crypto Currencies
            // ------------------------
            // EUR « Euro
            // GBP « Pound
            // CAD « Canadian Dollar
            // JPY « Yen
            // KRW « Korean Won

            default: coinMarketCapCode = currency;
          }
          let currencyInfo = _.find(coinMarketCapData, { symbol: coinMarketCapCode });
          if (currencyInfo && currency !== 'USD') {
            approximateUsdEquivs[currency] = Number(currencyInfo.price_usd);
          }
          if (!currencyInfo){
            console.log('WARNING (privateer): Ignoring currency that cannot be found in coinmarketcap (`'+currency+'`)...');
          }
        }//∞
      }//∫

      return exits.success(approximateUsdEquivs);
    },
    //   ██████╗ ███████╗████████╗   ██╗  ██╗ ██████╗ ██╗     ██████╗ ██╗███╗   ██╗ ██████╗ ███████╗
    //  ██╔════╝ ██╔════╝╚══██╔══╝   ██║  ██║██╔═══██╗██║     ██╔══██╗██║████╗  ██║██╔════╝ ██╔════╝
    //  ██║  ███╗█████╗     ██║      ███████║██║   ██║██║     ██║  ██║██║██╔██╗ ██║██║  ███╗███████╗
    //  ██║   ██║██╔══╝     ██║      ██╔══██║██║   ██║██║     ██║  ██║██║██║╚██╗██║██║   ██║╚════██║
    //  ╚██████╔╝███████╗   ██║      ██║  ██║╚██████╔╝███████╗██████╔╝██║██║ ╚████║╚██████╔╝███████║
    //   ╚═════╝ ╚══════╝   ╚═╝      ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝
    //
    getHoldings: async function(inputs, exits) {
      // {// Check API credentials.
      //   let missing = _.difference(exchangeInfo.apiCredentials, _.keys(inputs));
      //   if (missing.length > 0) {
      //     throw {missingCredentials:missing};
      //   }
      // }//∫
      // ^^FUTURE: potentially bring that back

      // Initialize and configure exchange.
      var ccxtExchange = Object.assign(new ccxt[exchangeInfo.ccxtId](), _.pick(inputs, exchangeInfo.apiCredentials));

      // ```
      // fetchBalance()
      // ```
      var ccxtBalanceReport = await ccxtExchange.fetchBalance();
      // e.g.
      // {"info":[{"Currency":"BTC","Balance":0.00099001,"Available":0.00099001,"Pending":0,"CryptoAddress":"1Jc9ftGtnJJdCLSunXWi1cteMvkn8jLP5d"},{"Currency":"ETC","Balance":0.26495956,"Available":0.26495956,"Pending":0,"CryptoAddress":null}],"LTC":{"free":0,"used":0,"total":0},"DOGE":{"free":0,"used":0,"total":0},"VTC":{"free":0,"used":0,"total":0},"PPC":{"free":0,"used":0,"total":0},"FTC":{"free":0,"used":0,"total":0},"RDD":{"free":0,"used":0,"total":0},"NXT":{"free":0,"used":0,"total":0},"DASH":{"free":0,"used":0,"total":0},"POT":{"free":0,"used":0,"total":0},"BLK":{"free":0,"used":0,"total":0},"EMC2":{"free":0,"used":0,"total":0},"XMY":{"free":0,"used":0,"total":0},"AUR":{"free":0,"used":0,"total":0},"EFL":{"free":0,"used":0,"total":0},"GLD":{"free":0,"used":0,"total":0},"SLR":{"free":0,"used":0,"total":0},"PTC":{"free":0,"used":0,"total":0},"GRS":{"free":0,"used":0,"total":0},"NLG":{"free":0,"used":0,"total":0},"RBY":{"free":0,"used":0,"total":0},"XWC":{"free":0,"used":0,"total":0},"MONA":{"free":0,"used":0,"total":0},"THC":{"free":0,"used":0,"total":0},"ENRG":{"free":0,"used":0,"total":0},"ERC":{"free":0,"used":0,"total":0},"VRC":{"free":0,"used":0,"total":0},"CURE":{"free":0,"used":0,"total":0},"XMR":{"free":0,"used":0,"total":0},"CLOAK":{"free":0,"used":0,"total":0},"START":{"free":0,"used":0,"total":0},"KORE":{"free":0,"used":0,"total":0},"XDN":{"free":0,"used":0,"total":0},"TRUST":{"free":0,"used":0,"total":0},"NAV":{"free":0,"used":0,"total":0},"XST":{"free":0,"used":0,"total":0},"BTCD":{"free":0,"used":0,"total":0},"VIA":{"free":0,"used":0,"total":0},"PINK":{"free":0,"used":0,"total":0},"IOC":{"free":0,"used":0,"total":0},"CANN":{"free":0,"used":0,"total":0},"SYS":{"free":0,"used":0,"total":0},"NEOS":{"free":0,"used":0,"total":0},"DGB":{"free":0,"used":0,"total":0},"BURST":{"free":0,"used":0,"total":0},"EXCL":{"free":0,"used":0,"total":0},"SWIFT":{"free":0,"used":0,"total":0},"DOPE":{"free":0,"used":0,"total":0},"BLOCK":{"free":0,"used":0,"total":0},"ABY":{"free":0,"used":0,"total":0},"BYC":{"free":0,"used":0,"total":0},"XMG":{"free":0,"used":0,"total":0},"BLITZ":{"free":0,"used":0,"total":0},"BAY":{"free":0,"used":0,"total":0},"BTS":{"free":0,"used":0,"total":0},"FAIR":{"free":0,"used":0,"total":0},"SPR":{"free":0,"used":0,"total":0},"VTR":{"free":0,"used":0,"total":0},"XRP":{"free":0,"used":0,"total":0},"GAME":{"free":0,"used":0,"total":0},"COVAL":{"free":0,"used":0,"total":0},"NXS":{"free":0,"used":0,"total":0},"XCP":{"free":0,"used":0,"total":0},"BITB":{"free":0,"used":0,"total":0},"GEO":{"free":0,"used":0,"total":0},"FLDC":{"free":0,"used":0,"total":0},"GRC":{"free":0,"used":0,"total":0},"FLO":{"free":0,"used":0,"total":0},"NBT":{"free":0,"used":0,"total":0},"MUE":{"free":0,"used":0,"total":0},"XEM":{"free":0,"used":0,"total":0},"CLAM":{"free":0,"used":0,"total":0},"DMD":{"free":0,"used":0,"total":0},"GAM":{"free":0,"used":0,"total":0},"SPHR":{"free":0,"used":0,"total":0},"OK":{"free":0,"used":0,"total":0},"SNRG":{"free":0,"used":0,"total":0},"PKB":{"free":0,"used":0,"total":0},"CPC":{"free":0,"used":0,"total":0},"AEON":{"free":0,"used":0,"total":0},"ETH":{"free":0,"used":0,"total":0},"GCR":{"free":0,"used":0,"total":0},"TX":{"free":0,"used":0,"total":0},"BCY":{"free":0,"used":0,"total":0},"EXP":{"free":0,"used":0,"total":0},"INFX":{"free":0,"used":0,"total":0},"OMNI":{"free":0,"used":0,"total":0},"AMP":{"free":0,"used":0,"total":0},"AGRS":{"free":0,"used":0,"total":0},"XLM":{"free":0,"used":0,"total":0},"BTC":{"free":0.00099001,"used":0,"total":0.00099001},"CLUB":{"free":0,"used":0,"total":0},"VOX":{"free":0,"used":0,"total":0},"EMC":{"free":0,"used":0,"total":0},"FCT":{"free":0,"used":0,"total":0},"MAID":{"free":0,"used":0,"total":0},"EGC":{"free":0,"used":0,"total":0},"SLS":{"free":0,"used":0,"total":0},"RADS":{"free":0,"used":0,"total":0},"DCR":{"free":0,"used":0,"total":0},"SAFEX":{"free":0,"used":0,"total":0},"BSD":{"free":0,"used":0,"total":0},"XVG":{"free":0,"used":0,"total":0},"PIVX":{"free":0,"used":0,"total":0},"XVC":{"free":0,"used":0,"total":0},"MEME":{"free":0,"used":0,"total":0},"STEEM":{"free":0,"used":0,"total":0},"2GIVE":{"free":0,"used":0,"total":0},"LSK":{"free":0,"used":0,"total":0},"PDC":{"free":0,"used":0,"total":0},"BRK":{"free":0,"used":0,"total":0},"DGD":{"free":0,"used":0,"total":0},"WAVES":{"free":0,"used":0,"total":0},"RISE":{"free":0,"used":0,"total":0},"LBC":{"free":0,"used":0,"total":0},"SBD":{"free":0,"used":0,"total":0},"BRX":{"free":0,"used":0,"total":0},"ETC":{"free":0.26495956,"used":0,"total":0.26495956},"STRAT":{"free":0,"used":0,"total":0},"UNB":{"free":0,"used":0,"total":0},"SYNX":{"free":0,"used":0,"total":0},"TRIG":{"free":0,"used":0,"total":0},"EBST":{"free":0,"used":0,"total":0},"VRM":{"free":0,"used":0,"total":0},"SEQ":{"free":0,"used":0,"total":0},"XAUR":{"free":0,"used":0,"total":0},"SNGLS":{"free":0,"used":0,"total":0},"REP":{"free":0,"used":0,"total":0},"SHIFT":{"free":0,"used":0,"total":0},"ARDR":{"free":0,"used":0,"total":0},"XZC":{"free":0,"used":0,"total":0},"NEO":{"free":0,"used":0,"total":0},"ZEC":{"free":0,"used":0,"total":0},"ZCL":{"free":0,"used":0,"total":0},"IOP":{"free":0,"used":0,"total":0},"GOLOS":{"free":0,"used":0,"total":0},"UBQ":{"free":0,"used":0,"total":0},"KMD":{"free":0,"used":0,"total":0},"GBG":{"free":0,"used":0,"total":0},"SIB":{"free":0,"used":0,"total":0},"ION":{"free":0,"used":0,"total":0},"LMC":{"free":0,"used":0,"total":0},"QWARK":{"free":0,"used":0,"total":0},"CRW":{"free":0,"used":0,"total":0},"SWT":{"free":0,"used":0,"total":0},"TIME":{"free":0,"used":0,"total":0},"MLN":{"free":0,"used":0,"total":0},"ARK":{"free":0,"used":0,"total":0},"DYN":{"free":0,"used":0,"total":0},"TKS":{"free":0,"used":0,"total":0},"MUSIC":{"free":0,"used":0,"total":0},"DTB":{"free":0,"used":0,"total":0},"INCNT":{"free":0,"used":0,"total":0},"GBYTE":{"free":0,"used":0,"total":0},"GNT":{"free":0,"used":0,"total":0},"NXC":{"free":0,"used":0,"total":0},"EDG":{"free":0,"used":0,"total":0},"LGD":{"free":0,"used":0,"total":0},"TRST":{"free":0,"used":0,"total":0},"WINGS":{"free":0,"used":0,"total":0},"RLC":{"free":0,"used":0,"total":0},"GNO":{"free":0,"used":0,"total":0},"GUP":{"free":0,"used":0,"total":0},"LUN":{"free":0,"used":0,"total":0},"APX":{"free":0,"used":0,"total":0},"TKN":{"free":0,"used":0,"total":0},"HMQ":{"free":0,"used":0,"total":0},"ANT":{"free":0,"used":0,"total":0},"SC":{"free":0,"used":0,"total":0},"BAT":{"free":0,"used":0,"total":0},"ZEN":{"free":0,"used":0,"total":0},"1ST":{"free":0,"used":0,"total":0},"QRL":{"free":0,"used":0,"total":0},"CRB":{"free":0,"used":0,"total":0},"PTOY":{"free":0,"used":0,"total":0},"MYST":{"free":0,"used":0,"total":0},"CFI":{"free":0,"used":0,"total":0},"BNT":{"free":0,"used":0,"total":0},"NMR":{"free":0,"used":0,"total":0},"SNT":{"free":0,"used":0,"total":0},"DCT":{"free":0,"used":0,"total":0},"XEL":{"free":0,"used":0,"total":0},"MCO":{"free":0,"used":0,"total":0},"ADT":{"free":0,"used":0,"total":0},"FUN":{"free":0,"used":0,"total":0},"PAY":{"free":0,"used":0,"total":0},"MTL":{"free":0,"used":0,"total":0},"STORJ":{"free":0,"used":0,"total":0},"ADX":{"free":0,"used":0,"total":0},"OMG":{"free":0,"used":0,"total":0},"CVC":{"free":0,"used":0,"total":0},"PART":{"free":0,"used":0,"total":0},"QTUM":{"free":0,"used":0,"total":0},"BCH":{"free":0,"used":0,"total":0},"DNT":{"free":0,"used":0,"total":0},"ADA":{"free":0,"used":0,"total":0},"MANA":{"free":0,"used":0,"total":0},"SALT":{"free":0,"used":0,"total":0},"TIX":{"free":0,"used":0,"total":0},"RCN":{"free":0,"used":0,"total":0},"VIB":{"free":0,"used":0,"total":0},"USDT":{"free":0,"used":0,"total":0},"free":{"LTC":0,"DOGE":0,"VTC":0,"PPC":0,"FTC":0,"RDD":0,"NXT":0,"DASH":0,"POT":0,"BLK":0,"EMC2":0,"XMY":0,"AUR":0,"EFL":0,"GLD":0,"SLR":0,"PTC":0,"GRS":0,"NLG":0,"RBY":0,"XWC":0,"MONA":0,"THC":0,"ENRG":0,"ERC":0,"VRC":0,"CURE":0,"XMR":0,"CLOAK":0,"START":0,"KORE":0,"XDN":0,"TRUST":0,"NAV":0,"XST":0,"BTCD":0,"VIA":0,"PINK":0,"IOC":0,"CANN":0,"SYS":0,"NEOS":0,"DGB":0,"BURST":0,"EXCL":0,"SWIFT":0,"DOPE":0,"BLOCK":0,"ABY":0,"BYC":0,"XMG":0,"BLITZ":0,"BAY":0,"BTS":0,"FAIR":0,"SPR":0,"VTR":0,"XRP":0,"GAME":0,"COVAL":0,"NXS":0,"XCP":0,"BITB":0,"GEO":0,"FLDC":0,"GRC":0,"FLO":0,"NBT":0,"MUE":0,"XEM":0,"CLAM":0,"DMD":0,"GAM":0,"SPHR":0,"OK":0,"SNRG":0,"PKB":0,"CPC":0,"AEON":0,"ETH":0,"GCR":0,"TX":0,"BCY":0,"EXP":0,"INFX":0,"OMNI":0,"AMP":0,"AGRS":0,"XLM":0,"BTC":0.00099001,"CLUB":0,"VOX":0,"EMC":0,"FCT":0,"MAID":0,"EGC":0,"SLS":0,"RADS":0,"DCR":0,"SAFEX":0,"BSD":0,"XVG":0,"PIVX":0,"XVC":0,"MEME":0,"STEEM":0,"2GIVE":0,"LSK":0,"PDC":0,"BRK":0,"DGD":0,"WAVES":0,"RISE":0,"LBC":0,"SBD":0,"BRX":0,"ETC":0.26495956,"STRAT":0,"UNB":0,"SYNX":0,"TRIG":0,"EBST":0,"VRM":0,"SEQ":0,"XAUR":0,"SNGLS":0,"REP":0,"SHIFT":0,"ARDR":0,"XZC":0,"NEO":0,"ZEC":0,"ZCL":0,"IOP":0,"GOLOS":0,"UBQ":0,"KMD":0,"GBG":0,"SIB":0,"ION":0,"LMC":0,"QWARK":0,"CRW":0,"SWT":0,"TIME":0,"MLN":0,"ARK":0,"DYN":0,"TKS":0,"MUSIC":0,"DTB":0,"INCNT":0,"GBYTE":0,"GNT":0,"NXC":0,"EDG":0,"LGD":0,"TRST":0,"WINGS":0,"RLC":0,"GNO":0,"GUP":0,"LUN":0,"APX":0,"TKN":0,"HMQ":0,"ANT":0,"SC":0,"BAT":0,"ZEN":0,"1ST":0,"QRL":0,"CRB":0,"PTOY":0,"MYST":0,"CFI":0,"BNT":0,"NMR":0,"SNT":0,"DCT":0,"XEL":0,"MCO":0,"ADT":0,"FUN":0,"PAY":0,"MTL":0,"STORJ":0,"ADX":0,"OMG":0,"CVC":0,"PART":0,"QTUM":0,"BCH":0,"DNT":0,"ADA":0,"MANA":0,"SALT":0,"TIX":0,"RCN":0,"VIB":0,"USDT":0},"used":{"LTC":0,"DOGE":0,"VTC":0,"PPC":0,"FTC":0,"RDD":0,"NXT":0,"DASH":0,"POT":0,"BLK":0,"EMC2":0,"XMY":0,"AUR":0,"EFL":0,"GLD":0,"SLR":0,"PTC":0,"GRS":0,"NLG":0,"RBY":0,"XWC":0,"MONA":0,"THC":0,"ENRG":0,"ERC":0,"VRC":0,"CURE":0,"XMR":0,"CLOAK":0,"START":0,"KORE":0,"XDN":0,"TRUST":0,"NAV":0,"XST":0,"BTCD":0,"VIA":0,"PINK":0,"IOC":0,"CANN":0,"SYS":0,"NEOS":0,"DGB":0,"BURST":0,"EXCL":0,"SWIFT":0,"DOPE":0,"BLOCK":0,"ABY":0,"BYC":0,"XMG":0,"BLITZ":0,"BAY":0,"BTS":0,"FAIR":0,"SPR":0,"VTR":0,"XRP":0,"GAME":0,"COVAL":0,"NXS":0,"XCP":0,"BITB":0,"GEO":0,"FLDC":0,"GRC":0,"FLO":0,"NBT":0,"MUE":0,"XEM":0,"CLAM":0,"DMD":0,"GAM":0,"SPHR":0,"OK":0,"SNRG":0,"PKB":0,"CPC":0,"AEON":0,"ETH":0,"GCR":0,"TX":0,"BCY":0,"EXP":0,"INFX":0,"OMNI":0,"AMP":0,"AGRS":0,"XLM":0,"BTC":0,"CLUB":0,"VOX":0,"EMC":0,"FCT":0,"MAID":0,"EGC":0,"SLS":0,"RADS":0,"DCR":0,"SAFEX":0,"BSD":0,"XVG":0,"PIVX":0,"XVC":0,"MEME":0,"STEEM":0,"2GIVE":0,"LSK":0,"PDC":0,"BRK":0,"DGD":0,"WAVES":0,"RISE":0,"LBC":0,"SBD":0,"BRX":0,"ETC":0,"STRAT":0,"UNB":0,"SYNX":0,"TRIG":0,"EBST":0,"VRM":0,"SEQ":0,"XAUR":0,"SNGLS":0,"REP":0,"SHIFT":0,"ARDR":0,"XZC":0,"NEO":0,"ZEC":0,"ZCL":0,"IOP":0,"GOLOS":0,"UBQ":0,"KMD":0,"GBG":0,"SIB":0,"ION":0,"LMC":0,"QWARK":0,"CRW":0,"SWT":0,"TIME":0,"MLN":0,"ARK":0,"DYN":0,"TKS":0,"MUSIC":0,"DTB":0,"INCNT":0,"GBYTE":0,"GNT":0,"NXC":0,"EDG":0,"LGD":0,"TRST":0,"WINGS":0,"RLC":0,"GNO":0,"GUP":0,"LUN":0,"APX":0,"TKN":0,"HMQ":0,"ANT":0,"SC":0,"BAT":0,"ZEN":0,"1ST":0,"QRL":0,"CRB":0,"PTOY":0,"MYST":0,"CFI":0,"BNT":0,"NMR":0,"SNT":0,"DCT":0,"XEL":0,"MCO":0,"ADT":0,"FUN":0,"PAY":0,"MTL":0,"STORJ":0,"ADX":0,"OMG":0,"CVC":0,"PART":0,"QTUM":0,"BCH":0,"DNT":0,"ADA":0,"MANA":0,"SALT":0,"TIX":0,"RCN":0,"VIB":0,"USDT":0},"total":{"LTC":0,"DOGE":0,"VTC":0,"PPC":0,"FTC":0,"RDD":0,"NXT":0,"DASH":0,"POT":0,"BLK":0,"EMC2":0,"XMY":0,"AUR":0,"EFL":0,"GLD":0,"SLR":0,"PTC":0,"GRS":0,"NLG":0,"RBY":0,"XWC":0,"MONA":0,"THC":0,"ENRG":0,"ERC":0,"VRC":0,"CURE":0,"XMR":0,"CLOAK":0,"START":0,"KORE":0,"XDN":0,"TRUST":0,"NAV":0,"XST":0,"BTCD":0,"VIA":0,"PINK":0,"IOC":0,"CANN":0,"SYS":0,"NEOS":0,"DGB":0,"BURST":0,"EXCL":0,"SWIFT":0,"DOPE":0,"BLOCK":0,"ABY":0,"BYC":0,"XMG":0,"BLITZ":0,"BAY":0,"BTS":0,"FAIR":0,"SPR":0,"VTR":0,"XRP":0,"GAME":0,"COVAL":0,"NXS":0,"XCP":0,"BITB":0,"GEO":0,"FLDC":0,"GRC":0,"FLO":0,"NBT":0,"MUE":0,"XEM":0,"CLAM":0,"DMD":0,"GAM":0,"SPHR":0,"OK":0,"SNRG":0,"PKB":0,"CPC":0,"AEON":0,"ETH":0,"GCR":0,"TX":0,"BCY":0,"EXP":0,"INFX":0,"OMNI":0,"AMP":0,"AGRS":0,"XLM":0,"BTC":0.00099001,"CLUB":0,"VOX":0,"EMC":0,"FCT":0,"MAID":0,"EGC":0,"SLS":0,"RADS":0,"DCR":0,"SAFEX":0,"BSD":0,"XVG":0,"PIVX":0,"XVC":0,"MEME":0,"STEEM":0,"2GIVE":0,"LSK":0,"PDC":0,"BRK":0,"DGD":0,"WAVES":0,"RISE":0,"LBC":0,"SBD":0,"BRX":0,"ETC":0.26495956,"STRAT":0,"UNB":0,"SYNX":0,"TRIG":0,"EBST":0,"VRM":0,"SEQ":0,"XAUR":0,"SNGLS":0,"REP":0,"SHIFT":0,"ARDR":0,"XZC":0,"NEO":0,"ZEC":0,"ZCL":0,"IOP":0,"GOLOS":0,"UBQ":0,"KMD":0,"GBG":0,"SIB":0,"ION":0,"LMC":0,"QWARK":0,"CRW":0,"SWT":0,"TIME":0,"MLN":0,"ARK":0,"DYN":0,"TKS":0,"MUSIC":0,"DTB":0,"INCNT":0,"GBYTE":0,"GNT":0,"NXC":0,"EDG":0,"LGD":0,"TRST":0,"WINGS":0,"RLC":0,"GNO":0,"GUP":0,"LUN":0,"APX":0,"TKN":0,"HMQ":0,"ANT":0,"SC":0,"BAT":0,"ZEN":0,"1ST":0,"QRL":0,"CRB":0,"PTOY":0,"MYST":0,"CFI":0,"BNT":0,"NMR":0,"SNT":0,"DCT":0,"XEL":0,"MCO":0,"ADT":0,"FUN":0,"PAY":0,"MTL":0,"STORJ":0,"ADX":0,"OMG":0,"CVC":0,"PART":0,"QTUM":0,"BCH":0,"DNT":0,"ADA":0,"MANA":0,"SALT":0,"TIX":0,"RCN":0,"VIB":0,"USDT":0}}

      // Get a sorted list of the keys from the dictionary of available holdings (`.free`).
      // > This sorts currencies in ascending alphabetical order, which has the nice side effect
      // > of putting USD towards the bottom and common cryptocurrencies like BTC and ETH near
      // > the top.
      var sortedCurrenciesHeld = Object.keys(ccxtBalanceReport.free).sort();

      // Build our final dictionary of holdings
      // > At the same time, we:
      // >  • convert ccxt currency strings into privateer currency codes
      // >  • eliminate currencies we don't actually own
      // >  • cast numeric amounts as strings to match abstract interface (for precision)
      var freeHoldings = _.reduce(sortedCurrenciesHeld, (freeHoldings, currency)=>{
        var amount = ccxtBalanceReport.free[currency];
        if (amount !== 0) {
          freeHoldings[currency] = ccxtBalanceReport.free[currency];
        }
        return freeHoldings;
      }, {});

      // Send back the normalized mapping of currently available funds by currency.
      return exits.success(freeHoldings);

    }
  };//:=

  // If `onlySupportsMethods` was specified, use that.
  // Otherwise, include all known standard methods.
  var supportedMethods = exchangeInfo.onlySupportsMethods || Object.keys(ALL_ABSTRACT_DEFS_BY_IDENTITY).map((identity)=>machine.getMethodName(identity));

  // Package it up.
  var pg = machine.pack({
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

  // Attach the underlying ccxt exchange as a private property, for convenience.
  Object.defineProperty(pg, '_ccxtExchange', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: new ccxt[exchangeInfo.ccxtId]()
  });

  // Return the exchange-specific package.
  return pg;

};//ƒ




/**
 * .EXCHANGES
 *
 * Expose all currently available exchanges in this release of privateer,
 * keyed by slug with a bit of additional information on the right-hand side.
 *
 * @type {Dictionary}
 */

Object.defineProperty(module.exports, 'EXCHANGES', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: _.reduce(SUPPORTED_EXCHANGES_BY_SLUG, (simplified, exchangeInfo, slug)=>{
    simplified[slug] = _.pick(exchangeInfo, ['friendlyName', 'moreInfoUrl']);
    return simplified;
  }, {})
});





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
 * ._ccxt
 *
 * Expose the underlying ccxt library directly, for convenience.
 *
 * @type {Ref}
 * @api {Private}
 */

Object.defineProperty(module.exports, '_ccxt', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: ccxt
});


/**
 * .VERSION
 *
 * Expose the current version of privateer.
 *
 * @type {String}
 */

Object.defineProperty(module.exports, 'VERSION', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: PRIVATEER_PACKAGE_JSON.version
});



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// FUTURE: Expose abstract interface.
//
// /**
//  * .abstract()
//  *
//  * Get the abstract interface for all standard exchange methods
//  * supported by `privateer` (with some major help from ccxt, of course).
//  *
//  * This is
//  *
//  * @returns {Dictionary}
//  */
// Object.defineProperty(module.exports, 'abstract', {
//   enumerable: false,
//   configurable: false,
//   writable: false,
//   value: function (){
//     // Load, then deep-freeze and return.
//     throw new Error('Not implemented yet');
//   }
// });
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
