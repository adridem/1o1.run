// commands/currency.js
export async function currency(term, pair) {
  const frames=['-','\\','/','|'];
  let i=0;
  term.writeln('');
  term.write('['+frames[0]+']');
  const spin=setInterval(()=>{
    i++;
    term.write('\r['+frames[i%frames.length]+']');
  },100);

  let rate;
  try {
    const [b,q]=pair.split('-').map(s=>s.toUpperCase());
    const j=await fetch(`https://api.exchangerate.host/latest?base=${b}&symbols=${q}`).then(r=>r.json());
    rate=j.rates?.[q];
    if (!rate) throw new Error('Invalid pair');
  } catch(e) {
    clearInterval(spin);
    term.write('\r '); term.writeln('');
    term.writeln('✖ '+e.message);
    return;
  }
  clearInterval(spin);
  term.write('\r '); term.writeln('');
  term.writeln(b+' → '+q+' = '+rate);
}
