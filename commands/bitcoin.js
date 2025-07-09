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

  // helpers to fetch safely
  async function safeFetchJSON(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  }
  async function safeFetchText(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch {
      return null;
    }
  }

  // today’s data URLs
  const today = new Date().toISOString().split('T')[0];
  const urls = {
    price:  `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&price_change_percentage=24h,7d,30d`,
    fng:    `https://api.alternative.me/fng/?limit=1`,
    addr:   `https://api.blockchain.info/charts/n-unique-addresses?timespan=1days&format=json`,
    txns:   `https://api.blockchain.info/charts/n-transactions?timespan=1days&format=json`,
    diff:   `https://api.blockchain.info/q/getdifficulty`,
    mem:    `https://blockstream.info/api/mempool`,
    etf:    `https://api.bitbo.io/v1/etf_inflow`,
    fund:   `https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1`,
    oi:     `https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT`
  };

  // fetch all in parallel
  const [
    cgData, fngData,
    addrData, txData,
    diffText, memData,
    etfData, fundData,
    oiData
  ] = await Promise.all([
    safeFetchJSON(urls.price),
    safeFetchJSON(urls.fng),
    safeFetchJSON(urls.addr),
    safeFetchJSON(urls.txns),
    safeFetchText(urls.diff),
    safeFetchJSON(urls.mem),
    safeFetchJSON(urls.etf),
    safeFetchJSON(urls.fund),
    safeFetchJSON(urls.oi)
  ]);

  // stop spinner
  clearInterval(spin);
  term.write('\x1b[2K\r');

  // parse and display
  if (cgData && cgData[0]) {
    const btc = cgData[0];
    const price = btc.current_price?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '–';
    const ch24  = btc.price_change_percentage_24h_in_currency?.toFixed(2) + '%' || '–';
    const ch7   = btc.price_change_percentage_7d_in_currency?.toFixed(2) + '%' || '–';
    const vol24 = btc.total_volume?.toLocaleString() || '–';
    const cap   = btc.market_cap?.toLocaleString() || '–';
    const vol30 = Math.abs(btc.price_change_percentage_30d_in_currency)?.toFixed(2) + '%' || '–';

    term.writeln(`Price:         ${price} (${ch24} 24h)`);
    term.writeln(`Market Cap:    $${cap}`);
    term.writeln(`24h Volume:    $${vol24}`);
    term.writeln(`7d Change:     ${ch7}`);
    term.writeln(`30d Volatility:${vol30}`);
  } else {
    term.writeln('⚠️ CoinGecko data unavailable');
  }

  if (fngData && fngData.data && fngData.data[0]) {
    const f = fngData.data[0];
    term.writeln(`Fear & Greed:  ${f.value} (${f.classification})`);
  } else {
    term.writeln('⚠️ Fear & Greed data unavailable');
  }

  if (addrData?.values?.length) {
    const a = addrData.values.slice(-1)[0].y;
    term.writeln(`Active Addrs:  ${a.toLocaleString()}`);
  } else {
    term.writeln('⚠️ Active addresses data unavailable');
  }

  if (txData?.values?.length) {
    const t = txData.values.slice(-1)[0].y;
    term.writeln(`Txns per Day:  ${t.toLocaleString()}`);
  } else {
    term.writeln('⚠️ Transactions data unavailable');
  }

  const diff = diffText ? parseFloat(diffText).toLocaleString() : null;
  term.writeln(`Difficulty:    ${diff ?? '⚠️ unavailable'}`);

  if (memData && typeof memData.vsize === 'number') {
    term.writeln(`Mempool Size:  ${memData.vsize.toLocaleString()} vB`);
  } else {
    term.writeln('⚠️ Mempool data unavailable');
  }

  if (etfData?.result?.inflow != null) {
    term.writeln(`ETF Flow:      ${parseFloat(etfData.result.inflow).toLocaleString()} BTC`);
  } else {
    term.writeln('⚠️ ETF flow data unavailable');
  }

  if (Array.isArray(fundData) && fundData[0]?.fundingRate != null) {
    term.writeln(`Funding Rate:  ${(fundData[0].fundingRate * 100).toFixed(3)}%`);
  } else {
    term.writeln('⚠️ Funding rate data unavailable');
  }

  if (oiData?.openInterest != null) {
    term.writeln(`Open Interest: $${parseFloat(oiData.openInterest).toLocaleString()}`);
  } else {
    term.writeln('⚠️ Open interest data unavailable');
  }
}
