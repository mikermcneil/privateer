module.exports = {


  friendlyName: 'Get exchange rates',


  description: 'Get the latest market rates for currencies traded on this exchange.',


  // Only relevant for 'serial' argin style:
  args: ['currencies', '{*}'],


  inputs: {

    apiKey: require('../PARAMETERS').apiKey,

    secret: require('../PARAMETERS').secret,

    password: require('../PARAMETERS').password,

    currencies: {
      type: ['string'],
      example: ['BTC', 'ETH', 'USD', 'LTC', 'BCH'],
      description: 'The currencies to check.',
      extendedDescription:
`If left unspecified, then the result mapping will cover market prices for **all**
possible operations based on the exchange\'s available currency markets.`
    }

  },


  exits: {

    success: {
      outputFriendlyName: 'Exchange rates for 1... in...',
      outputDescription: 'A mapping of current market exchange rates for trading away 1 unit of one currency for some amount of another.',
      extendedDescription:
`If the exchange doesn't support subtracting a particular currency at all, then it will be absent altogether from the top level
of the mapping.  Similarly, if a currency can be subtracted, but cannot be traded for some other particular currency, then no key
will exist for that other currency in the nested dictionary.

Remember: Just because an exchange supports trading away one currency for some other currency, there is no guarantee that it also
necessarily supports the inverse operation at runtime (although it technically should in 99% of cases).  More relevantly though,
even though an exchange supports trading both directions between currencies, there is no guarantee that the exchange rates are
reciprocals of one another-- the effective rate is determined by up-to-the-minute supply and demand.  This data structure, which
can also be imagined as a directed, weighted "trade graph" where each market exchange rate is associated with a particular "edge",
allows us to efficiently encode all of that.

For example, if an exchange allows only USD»BTC, BTC»ETH, BTC»USD, and LTC»ETH orders, the exchange rate mapping might look
something like this:

\`\`\`
{
  USD: {
    BTC: '0.0001'
  },
  BTC: {
    ETH: '15.38482',
    USD: '6001.52'
  },
  LTC: {
    ETH: '0.18300940668'
  }
}
\`\`\`

#### Side note about the implementation:
For any given symbol in ccxt (e.g. "ETH/BTC"), the currency listed on top is the "base" currency,
and the currency listed on bottom is the "quote" currency.  (Note that this has been deliberately
normalized in ccxt.)  Symbols represent a currency market, and are bidirectional.  The integration
with those symbols and the markets they represent is abstracted away by \`privateer\`, so generally
instead of thinking about 2-way "symbols", when using privateer, you can just think about (A) currencies
like "ETH" and "BTC" and (B) one-way operations between them like "ETH»BTC" ("trade ETH for BTC").
`,
      outputType: {},
      outputExample: {
        BTC: {
          ETH: '20.9264910962',
          USD: '6371.03',
          LTC: '120.918984281'
        },
        USD: {
          BTC: '0.00015696049',
          ETH: '0.00328040939'
        },
        LTC: {
          BTC: '0.00827',
          USD: '54.60'
        }
      }
    }

  }

};

