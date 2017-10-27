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
  'list-holdings',
  'list-active-orders'
];

var SUPPORTED_EXCHANGES_BY_SLUG = {
  bitfinex: {
    friendlyName: 'Bitfinex',
    supportedMethods: ALL_BASIC_METHODS.concat('send-authenticated-request')
  },
  bittrex: {
    friendlyName: 'Bittrex',
    supportedMethods: ALL_BASIC_METHODS
  },
  // TODO: more
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
    dir: __dirname,
    pkg: {
      name: 'privateer  (for the '+exchangeInfo.friendlyName+' exchange)',
      version: PRIVATEER_PACKAGE_JSON.version,
      machinepack: {
        friendlyName: exchangeInfo.friendlyName,
        machineDir: './'+exchange,
        machines: exchangeInfo.supportedMethods
      }
    }
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
