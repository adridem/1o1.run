// commands/stocks.js
export async function stocks(term, sym) {
  const frames=['-','\\','/','|'];
  let i=0;
  const s=sym.toUpperCase();
  term.writeln('');
  term.write('['+frames[0]+']');
  const spin=setInterval(()=>{
    i++;
    term.write('\r['+frames[i%frames.length]+']');
  },100);

  let r;
  try {
    const j=await fetch(`https://query2.finance.yahoo.com/v6/finance/quote?symbols=${s}`).then(r=>r.json());
    r=j.quoteResponse?.result?.[0];
    if (!r) throw new Error('Symbol not found');
  } catch(e) {
    clearInterval(spin);
    term.write('\r '); term.writeln('');
    term.writeln('✖ '+e.message);
    return;
  }
  clearInterval(spin);
  term.write('\r '); term.writeln('');
  const arrow=r.regularMarketChangePercent>=0?'↑':'↓';
  term.writeln(s+' '+arrow+' '+r.regularMarketChangePercent.toFixed(2)+'%  $'+r.regularMarketPrice);
}
