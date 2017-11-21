/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var ccxt = require('ccxt');


/**
 * getCurrencies()
 *
 * @param  {String} ccxtExchangeId
 * @param  {Ref?} _ccxtExchange        («An optional, already-instantiated ccxt exchange instance)
 * @return {Array}
 *         All tradeable currencies on this exchange.
 */
module.exports = async function getCurrencies(ccxtExchangeId, _ccxtExchange){

  // Obtain a unique list of currencies traded on our exchange.
  // > To do this, we initialize the exchange, then fetch symbols (i.e. currency markets)
  // > and extract the involved currencies from there.
  // > (no need to use credentials-- this one is part of the public API)
  var ccxtExchange = _ccxtExchange || new ccxt[ccxtExchangeId]();

  var relevantMarkets = await ccxtExchange.fetchMarkets();
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Note: As of Nov 2017, running `ccxtExchange.currencies` is equivalent to the following code...
  // for some exchanges anyway.  But this cannot be trusted!  It only works sometimes (presumably
  // for those exchanges where the supported currencies had to be hard-coded)
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  return _.union(_.pluck(_.values(relevantMarkets), 'base'), _.pluck(_.values(relevantMarkets), 'quote'));

};
