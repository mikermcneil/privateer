module.exports = {


  friendlyName: 'Get exchange rates',


  description: 'Get which currencies can be traded for this exchange, as well as the latest market rates.',


  inputs: {

    apiKey: require('../INPUTS').apiKey,

    secret: require('../INPUTS').secret,

  },


  exits: {

    success: {
      outputFriendlyName: 'Exchange rates for 1... in...',
      outputDescription: 'A mapping of current market exchange rates for trading 1 unit of one currency for some amount of another.',
      extendedDescription:
`If the exchange doesn't support selling a particular currency at all, then it will be absent altogether from the top level
of the mapping.  Similarly, if a currency can be sold, but cannot be traded for some other particular currency, then no key
will exist for that other currency in the nested dictionary.

Remember: Just because an exchange supports selling one currency for some other currency, there is no guarantee that it also
necessarily supports the inverse operation.  Similarly, if an exchange supports trading both directions between currencies,
there is no guarantee that the exchange rates are reciprocals of one another-- the effective rate is determined by up-to-the-minute
supply and demand.  This data structure, which can also be imagined as a directed, weighted "trade graph" where each market exchange
rate is associated with a particular "edge", allows us to efficiently encode all of that.

For example, if an exchange allows only USD»BTC, BTC»ETH, BTC»USD, and LTC»ETH orders, the exchange rate mapping might look
something like this:

\`\`\`
{
  usd: {
    btc: '0.0001'
  },
  btc: {
    eth: '15.38482',
    usd: '6001.52'
  },
  ltc: {
    eth: '0.18300940668'
  }
}
\`\`\`

`,
      outputType: {},
      outputExample: {
        btc: {
          eth: '20.9264910962',
          usd: '6371.03',
          ltc: '120.918984281'
        },
        usd: {
          btc: '0.00015696049',
          eth: '0.00328040939'
        },
        ltc: {
          btc: '0.00827',
          usd: '54.60'
        }
      }
    }

  }

};

