// commands/stocks.js

export async function stocks(term, sym) {
  const frames = ['-','\\','/','|'];
  let i = 0;
  const raw = sym.trim().toUpperCase();
  if (!raw) {
    term.writeln('✖ No symbol provided');
    return;
  }

  // build Stooq CSV URL (.US suffix for US tickers)
  const ticker  = raw + '.US';
  const stooq  = `https://stooq.com/q/l/?s=${ticker}&f=sd2t2ohlcv&h&e=csv`;
  const proxy   = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(stooq);

  // start spinner
  term.writeln('');
  term.write('[' + frames[0] + ']');
  const spin = setInterval(() => {
    i++;
    term.write('\r[' + frames[i % frames.length] + ']');
  }, 100);

  let csv;
  try {
    const res = await fetch(proxy);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    csv = await res.text();
  } catch (e) {
    clearInterval(spin);
    term.write('\x1b[2K\r');
    term.writeln('✖ Network error: ' + e.message);
    return;
  }

  // parse CSV
  const lines = csv.trim().split('\n');
  if (lines.length < 2) {
    clearInterval(spin);
    term.write('\x1b[2K\r');
    term.writeln('✖ No data for ' + raw);
    return;
  }
  const cols = lines[1].split(',');
  const open  = parseFloat(cols[3]);
  const close = parseFloat(cols[6]);
  if (isNaN(open) || isNaN(close)) {
    clearInterval(spin);
    term.write('\x1b[2K\r');
    term.writeln('✖ Invalid data for ' + raw);
    return;
  }

  // compute change%
  const changePct = ((close - open) / open) * 100;
  const arrow     = changePct >= 0 ? '↑' : '↓';

  // stop spinner & clear its line
  clearInterval(spin);
  term.write('\x1b[2K\r');

  // show result
  term.writeln(
    `${raw} ${arrow} ${changePct.toFixed(2)}%  $${close.toFixed(2)}`
  );
}
