# privateer

Integrate with exchanges like Bitfinex for crypto-currency trading in your JavaScript / Node.js / Sails.js app.  Supports Bitcoin, Ethereum, and more.

> **WARNING**
>
> This package is a work in progress.  Its internals are currently in the midst of development, and parts of it are still only stubs.
>
> As of the time of writing this note, you can find the latest abstract method definitions [here](https://github.com/mikermcneil/privateer/tree/master/lib/abstract-interface-for-exchanges/methods).
>
> -@mikermcneil, Nov 7, 2017

## Installation &nbsp; [![NPM version](https://badge.fury.io/js/privateer.svg)](http://badge.fury.io/js/privateer)

To install this package, run:

```bash
$ npm install privateer
```

Then require it from the actions or helpers in your Sails app, a command-line script, or any other Node.js module.

## Usage

privateer supports `await`, with fallback support for callbacks (`.exec()`), and promise-chaining (`.then()`) via the [parley](https://npmjs.com/package/parley) interface (an extension of bluebird).  Other than the special case of `.configure()`, all exchange methods are parley Callables, which means they can use Deferreds that support `.intercept()`, `.tolerate()`, `.toPromise()`, `.now()`, and `.log()`.

### Exchanges

To see all available exchanges:

```js
require('privateer');
```


### Configuration

Set credentials as global defaults for a particular exchange:

```js
privateer('gdax').configure({
  apiKey: '«YOUR API KEY»',
  secret: '«YOUR API SECRET»',
  password: '«YOUR GDAX PASSPHRASE»',
});
```

### Methods

To see all available methods:

```js
privateer('gdax');
```


#### cancelEachOrder()

```js
await privateer('gdax').cancelEachOrder({
  orderIds: [ '448383729', '448383891', … ]
});
```

> [Docs](https://github.com/mikermcneil/privateer/blob/master/lib/abstract-interface-for-exchanges/methods/CANCEL_EACH_ORDER.js)



#### createEachOrder()

```js
var newOrders = await privateer('gdax').createEachOrder({
  orders: [
    { operation: 'BTC»USD', subtract: '0.000002' },
    { operation: 'ETH»LTC', subtract: '2.45' }, …
  ]
});
// order summaries; e.g.
// [
//   { id: '448383729', operation: 'BTC»USD', subtract: '0.000002' },
//   { id: '448383891', operation: 'ETH»LTC', subtract: '2.45' }, …
// ]
```

> [Docs](https://github.com/mikermcneil/privateer/blob/master/lib/abstract-interface-for-exchanges/methods/CREATE_EACH_ORDER.js)



#### getActiveOrders()

```js
var activeOrders = await privateer('gdax').getActiveOrders();
// order summaries; e.g.
// [
//   {
//     id: '448383729',
//     operation: 'BTC»USD',
//     subtract: '0.02'
//   }, …
// ]
```

> [Docs](https://github.com/mikermcneil/privateer/blob/master/lib/abstract-interface-for-exchanges/methods/GET_ACTIVE_ORDERS.js)



#### getExchangeRates()

```js
var rates = await privateer('gdax').getExchangeRates();
// e.g.
// {
//   BTC: {
//     ETH: '20.9264910962',
//     USD: '6371.03',
//     LTC: '120.918984281'
//   },
//   USD: {
//     BTC: '0.00015696049',
//     ETH: '0.00328040939'
//   },
//   LTC: {
//     BTC: '0.00827',
//     USD: '54.60'
//   }
// }
```

> [Docs](https://github.com/mikermcneil/privateer/blob/master/lib/abstract-interface-for-exchanges/methods/GET_EXCHANGE_RATES.js)



#### getHoldings()

```js
var holdings = await privateer('bitfinex').getHoldings();
// e.g.
// {
//   BTC: '0.000053',
//   ETH: '13.283523',
//   USD: '55.03'
// }
```

> [Docs](https://github.com/mikermcneil/privateer/blob/master/lib/abstract-interface-for-exchanges/methods/GET_HOLDINGS.js)


## Other stuff

For convenience, `privateer` exposes the underlying ccxt library as `.ccxt`.

```js
require('privateer').ccxt

// e.g.
// { version: '1.9.346',
//   Exchange: { [Function: Exchange] ccxtVersion: '1.9.346' },
//   exchanges:
//    [ '_1broker',
//
// …and so on
```

> See http://npmjs.com/package/ccxt for more information.



## Compatibility

Node.js v8.x and up.

<a href="https://sailsjs.com"><img width="50" src="https://camo.githubusercontent.com/9e49073459ed4e0e2687b80eaf515d87b0da4a6b/687474703a2f2f62616c64657264617368792e6769746875622e696f2f7361696c732f696d616765732f6c6f676f2e706e67" /></a>&nbsp;<a href="http://nodejs.org"><img width="60" src="https://user-images.githubusercontent.com/618009/28782759-c62f8f20-75d3-11e7-8a83-32fb52178416.png" /></a>

[![NPM](https://nodei.co/npm/privateer.png?downloads=true)](http://npmjs.com/package/privateer)

## License

This package is available under the **________ license**.

Copyright &copy; 2017 [Mike McNeil](https://twitter.com/mikermcneil), [St. Nicholas Crumrine](https://github.com/uncletammy), [Sails Co.](https://sailsjs.com/about)


