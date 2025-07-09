// commands/bitcoin.js

export async function bitcoin(term) {
  const frames = ['-','\\','/','|'];
  let i = 0;

  // spinner
  term.writeln('');
  term.write('[' + frames[0] + ']');
  const spin = setInterval(() => {
    i++;
    term.write('\r[' + frames[i % frames.length] + ']');
  }, 100);

  // helpers
  async function safeFetchJSON(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
  async function safeFetchText(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }
  function classify7dChange(x) {
    if (x > 5)      return 'Bullish';
    if (x > 0)      return 'Positive';
    if (x < -5)     return 'Bearish';
    if (x < 0)      return 'Negative';
    return 'Neutral';
  }
  function classifyFNG(v) {
    if (v >= 75) return 'Extreme Greed';
    if (v >= 50) return 'Greed';
    if (v >= 25) return 'Fear';
    return 'Extreme Fear';
  }

  // endpoints (proxy blockchain.info charts through AllOrigins for CORS)
  const proxy = 'https://api.allorigins.win/raw?url=';
  const urls = {
    price: `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&price_change_percentage=24h,7d,30d`,
    fng:   `https://api.alternative.me/fng/?limit=1`,
    addr:  proxy + encodeURIComponent('https://api.blockchain.info/charts/n-unique-addresses?timespan=1days&format=json'),
    txns:  proxy + encodeURIComponent('https://api.blockchain.info/charts/n-transactions?timespan=1days&format=json'),
    diff:  `https://api.blockchain.info/q/getdifficulty`,
    mem:   `https://blockstream.info/api/mempool`,
    fund:  `https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1`,
    oi:    `https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT`
  };

  // fetch all
  const [
    cgData, fngData,
    addrData, txData,
    diffText, memData,
    fundData, oiData
  ] = await Promise.all([
    safeFetchJSON(urls.price),
    safeFetchJSON(urls.fng),
    safeFetchJSON(urls.addr),
    safeFetchJSON(urls.txns),
    safeFetchText(urls.diff),
    safeFetchJSON(urls.mem),
    safeFetchJSON(urls.fund),
    safeFetchJSON(urls.oi)
  ]);

  // stop spinner
  clearInterval(spin);
  term.write('\x1b[2K\r');

  // 1) Price & Market
  if (cgData && cgData[0]) {
    const b = cgData[0];
    const price = b.current_price?.toLocaleString('en-US',{style:'currency',currency:'USD'}) || '–';
    const ch24  = (b.price_change_percentage_24h_in_currency ?? 0).toFixed(2) + '%';
    const ch7raw= b.price_change_percentage_7d_in_currency ?? 0;
    const ch7   = ch7raw.toFixed(2) + '%';
    const cap   = (b.market_cap ?? 0).toLocaleString();
    const vol24 = (b.total_volume ?? 0).toLocaleString();
    const vol30 = Math.abs(b.price_change_percentage_30d_in_currency ?? 0).toFixed(2) + '%';

    term.writeln(`Price:         ${price} (${ch24} 24h)`);
    term.writeln(`Market Cap:    $${cap}`);
    term.writeln(`24h Volume:    $${vol24}`);
    term.writeln(`7d Change:     ${ch7} [${classify7dChange(ch7raw)}]`);
    term.writeln(`30d Volatility:${vol30}`);
  } else {
    term.writeln('⚠️ CoinGecko data unavailable');
  }

  // 2) Fear & Greed
  if (fngData?.data?.[0]) {
    const f = fngData.data[0];
    const val = parseInt(f.value,10);
    const cls = f.classification || classifyFNG(val);
    term.writeln(`Fear & Greed:  ${val}% (${cls})`);
  } else {
    term.writeln('⚠️ Fear & Greed data unavailable');
  }

  // 3) Active Addresses
  if (addrData?.values?.length) {
    const a = addrData.values.slice(-1)[0].y;
    term.writeln(`Active Addrs:  ${a.toLocaleString()}`);
  } else {
    term.writeln('⚠️ Active addresses data unavailable');
  }

  // 4) Transactions per Day
  if (txData?.values?.length) {
    const t = txData.values.slice(-1)[0].y;
    term.writeln(`Txns per Day:  ${t.toLocaleString()}`);
  } else {
    term.writeln('⚠️ Transactions data unavailable');
  }

  // 5) Difficulty
  const diff = diffText ? parseFloat(diffText).toLocaleString() : null;
  term.writeln(`Difficulty:    ${diff ?? '⚠️ unavailable'}`);

  // 6) Mempool Size
  if (memData?.vsize != null) {
    term.writeln(`Mempool Size:  ${memData.vsize.toLocaleString()} vB`);
  } else {
    term.writeln('⚠️ Mempool data unavailable');
  }

  // 7) ETF Flow (no reliable endpoint)
  term.writeln(`ETF Flow:      ⚠️ unavailable`);

  // 8) Funding Rate
  if (Array.isArray(fundData) && fundData[0]?.fundingRate != null) {
    term.writeln(`Funding Rate:  ${(fundData[0].fundingRate * 100).toFixed(3)}%`);
  } else {
    term.writeln('⚠️ Funding rate data unavailable');
  }

  // 9) Open Interest
  if (oiData?.openInterest != null) {
    term.writeln(`Open Interest: $${parseFloat(oiData.openInterest).toLocaleString()}`);
  } else {
    term.writeln('⚠️ Open interest data unavailable');
  }
}
