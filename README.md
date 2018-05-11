# privateer

Integrate with exchanges like Bitfinex for crypto-currency trading in your JavaScript / Node.js / Sails.js app.  Supports Bitcoin, Ethereum, and more.

![Selling fiat currency / cryptocurrency](https://user-images.githubusercontent.com/618009/32758679-3a88ac92-c8ab-11e7-9d94-0891afcc22f4.png)
![Indirectly selling fiat currency / cryptocurrency by buying on a reciprocal market](https://user-images.githubusercontent.com/618009/32758667-280b1a78-c8ab-11e7-8e13-c00d28107f9f.png)


> **WARNING**
>
> This package does not yet necessarily use IEEE-floating-point-safe math yet (see TODOs in the code).  Pull requests welcome!
>
> As of the time of writing this note, you can find the latest abstract method definitions [here](https://github.com/mikermcneil/privateer/tree/master/lib/abstract-interface-for-exchanges/methods).
>
> -@mikermcneil, May 11, 2018

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
  apiKey: '«YOUR API KEY->',
  secret: '«YOUR API SECRET->',
  password: '«YOUR GDAX PASSPHRASE->',
});
```

### Methods

To see all available methods:

```js
privateer('gdax');
```


> See [Docs](https://github.com/mikermcneil/privateer/tree/master/lib/abstract-interface-for-exchanges/methods)


## Other stuff

For convenience, `privateer` exposes the underlying ccxt library as `._ccxt`.

> **WARNING:** The underlying version of ccxt might change at any time between major (or even minor) releases of privateer.

```js
require('privateer')._ccxt

// e.g.
// { version: '1.9.346',
//   Exchange: { [Function: Exchange] ccxtVersion: '1.9.346' },
//   exchanges:
//    [ '_1broker',
//
// …and so on
```

> See http://npmjs.com/package/ccxt for more information.

Similarly, privateer exposes the exchange-specific ccxt dao as `_ccxtExchange`:

```js
require('privateer')('bittrex')._ccxtExchange
```



## Compatibility

Node.js v8.x and up.

<a href="https://sailsjs.com"><img width="50" src="https://camo.githubusercontent.com/9e49073459ed4e0e2687b80eaf515d87b0da4a6b/687474703a2f2f62616c64657264617368792e6769746875622e696f2f7361696c732f696d616765732f6c6f676f2e706e67" /></a>&nbsp;<a href="http://nodejs.org"><img width="60" src="https://user-images.githubusercontent.com/618009/28782759-c62f8f20-75d3-11e7-8a83-32fb52178416.png" /></a>

[![NPM](https://nodei.co/npm/privateer.png?downloads=true)](http://npmjs.com/package/privateer)

## License

This package is available under the **MIT license**.

Copyright &copy; 2017-present [Mike McNeil](https://twitter.com/mikermcneil), [St. Nicholas Crumrine](https://github.com/uncletammy), [Sails Co.](https://sailsjs.com/about)


