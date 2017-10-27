# privateer

Integrate with exchanges like Bitfinex for crypto-currency trading in your JavaScript/Node.js/Sails.js app.  Supports Bitcoin, Ethereum, and more.

## Installation &nbsp; [![NPM version](https://badge.fury.io/js/privateer.svg)](http://badge.fury.io/js/privateer)

To install this package, run:

```bash
$ npm install privateer --save
```

Then require it from the actions or helpers in your Sails app, a command-line script, or any other Node.js module.

## Usage

To see all available exchanges:

```js
privateer
```

To see all available methods:

```js
privateer('bitfinex')
```


#### Example

```js
privateer('bitfinex').setGlobalDefaults({
  apiKey: '<YOUR API KEY>',
  secret: '<YOUR API SECRET>',
}).now();

// …

await privateer('bitfinex').listHoldings();
// e.g.
// {
//   btc: '0.0',
//   eth: '0.0'
// }
```


[![NPM](https://nodei.co/npm/privateer.png?downloads=true)](http://npmjs.com/package/privateer)

## Compatibility

Node.js v8.x and up.

<a href="https://sailsjs.com"><img width="50" src="https://camo.githubusercontent.com/9e49073459ed4e0e2687b80eaf515d87b0da4a6b/687474703a2f2f62616c64657264617368792e6769746875622e696f2f7361696c732f696d616765732f6c6f676f2e706e67" /></a>&nbsp;<a href="http://nodejs.org"><img width="60" src="https://user-images.githubusercontent.com/618009/28782759-c62f8f20-75d3-11e7-8a83-32fb52178416.png" /></a>



## License

This package is available under the **________ license**.

Copyright &copy; 2017 [Mike McNeil](https://twitter.com/mikermcneil), [St. Nicholas Crumrine](https://github.com/uncletammy), [Sails Co.](https://sailsjs.com/about)


