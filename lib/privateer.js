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
  'send-authenticated-request',
  'create-each-order',
  'cancel-each-order',
  'list-holdings',
  'list-active-orders'
];

var SUPPORTED_EXCHANGES_BY_SLUG = {
  bitfinex: {
    friendlyName: 'Bitfinex',
    supportedMethods: ALL_BASIC_METHODS
  },
  // TODO: more
};



/**
 * privateer()
 *
 * @param {String} exchange
 * @returns {Dictionary}
 */

module.exports = function privateer(exchange){

  var exchangeFriendlyName;
  var supportedMethods;

  if (exchange === 'bitfinex') {
    exchangeFriendlyName = 'Bitfinex';
    supportedMethods = ALL_BASIC_METHODS;
  }
  else {
    throw new Error('"'+exchange+'" is not a supported exchange.');
  }

  return machine.pack({
    pkg: {
      name: 'privateer  (for the '+exchangeFriendlyName+' exchange)',
      version: PRIVATEER_PACKAGE_JSON.version,
      machinepack: {
        friendlyName: exchangeFriendlyName,
        machineDir: './'+exchange,
        machines: supportedMethods
      }
    },
    dir: __dirname
  });

};


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
