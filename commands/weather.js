// commands/weather.js
export async function weather(term, loc, codes) {
  const frames = ['-','\\','/','|'];
  let i = 0;
  // spinner line
  term.writeln('');
  term.write('['+frames[0]+']');
  const spin = setInterval(()=>{
    i++;
    term.write('\r['+frames[i%frames.length]+']');
  },100);

  // fetch
  let geo, wx;
  try {
    geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json`).then(r=>r.json());
    if (!geo[0]) throw new Error('Location not found');
    const {lat,lon} = geo[0];
    wx = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`+
      `&current_weather=true&hourly=temperature_2m,weathercode&timezone=auto`
    ).then(r=>r.json());
  } catch(e) {
    clearInterval(spin);
    term.write('\r '); // clear spinner
    term.writeln('\n✖ '+e.message);
    return;
  }
  clearInterval(spin);
  term.write('\r '); // clear spinner
  term.writeln('');  // move to next line

  // output
  const c = wx.current_weather;
  const [icon,desc] = codes[c.weathercode]||['❓','Unknown'];
  term.writeln('Now: '+icon+' '+c.temperature+'°C  •  '+desc);
  const {time,temperature_2m,weathercode} = wx.hourly;
  const idx = time.findIndex(t=>t.startsWith(c.time.substr(0,13)));
  let line = 'Next: ';
  for (let j=idx+1;j<=idx+5&&j<time.length;j++){
    const hh = new Date(time[j]).getHours().toString().padStart(2,'0')+':00';
    const t = temperature_2m[j];
    const [ic] = codes[weathercode[j]]||['❓'];
    line += '| '+hh+' '+ic+' '+t+'°C ';
  }
  term.writeln(line);
}
