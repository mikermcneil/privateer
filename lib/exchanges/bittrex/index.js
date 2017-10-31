module.exports = {
  'list-holdings': async function (inputs, exits) {

    // https://docs.bitfinex.com/v1/reference#rest-auth-wallet-balances

    var resData = await privateer('bitfinex').sendAuthenticatedRequest({
      apiKey: inputs.apiKey,
      secret: inputs.secret,
      url: '/v1/balances'
    });

    // `resData` is an array of bitfinex "wallet balance objects".
    // e.g.
    // ```
    // [
    //   {
    //     type: 'exchange',
    //     currency: 'btc',
    //     amount: '0.0',
    //     available: '0.0'
    //   }
    // ]
    // ```

    var holdingsByCurrency = _.reduce(resData, (memo, wallet)=>{
      if (memo.type === 'exchange') {
        memo[wallet.currency] = wallet.available;
        return memo;
      }
      else {
        return memo;
      }
    }, {});

    return exits.success(holdingsByCurrency);
  }
};

