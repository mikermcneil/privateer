/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var parley = require('parley');


/**
 * pause()
 *
 * ```
 * await pause(300);
 * // or
 * await pause();
 * ```
 *
 * @param  {Number?} ms
 * @return {Deferred}
 */
module.exports = function pause(ms){

  return parley((done)=>{
    if (ms !== undefined && (!_.isNumber(ms) || ms < 0)) {
      throw new Error('If specified, expected argument to be the number of milliseconds to pause, but instead got: '+ms);
    }
    setTimeout(done, ms||0);
  });

};
