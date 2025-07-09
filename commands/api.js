// commands/api.js

export async function api(term) {
  term.writeln('\x1b[1;36mAPIs used by roswell.run:\x1b[0m');
  const list = [
    ['OpenStreetMap Nominatim','https://nominatim.openstreetmap.org/search'],
    ['Open-Meteo Forecast','https://api.open-meteo.com/v1/forecast'],
    ['Open-Meteo Marine','https://marine-api.open-meteo.com/v1/marine'],
    ['Hacker News Firebase','https://hacker-news.firebaseio.com/v0'],
    ['Hacker News Algolia','https://hn.algolia.com/api/v1/search'],
    ['ExchangeRate Host','https://api.exchangerate.host/latest'],
    ['Stooq CSV','https://stooq.com/q/l/'],
    ['CoinGecko Markets','https://api.coingecko.com/api/v3/coins/markets'],
    ['Alternative.me FNG','https://api.alternative.me/fng'],
    ['Blockchain.info Charts','https://api.blockchain.info/charts'],
    ['Blockchain.info Difficulty','https://api.blockchain.info/q/getdifficulty'],
    ['Blockstream Mempool','https://blockstream.info/api/mempool'],
    ['Bitbo.io ETF Inflow','https://api.bitbo.io/v1/etf_inflow'],
    ['Binance Funding Rate','https://fapi.binance.com/fapi/v1/fundingRate'],
    ['Binance Open Interest','https://fapi.binance.com/fapi/v1/openInterest']
  ];
  for (let [name, url] of list) {
    term.writeln(` • ${name}: ${url}`);
  }
}
