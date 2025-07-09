// commands/surf.js

export async function surf(term, loc, codes) {
  const frames = ['-','\\','/','|'];
  let i = 0;

  // show spinner
  term.writeln('');
  term.write('[' + frames[0] + ']');
  const spin = setInterval(() => {
    i++;
    term.write('\r[' + frames[i % frames.length] + ']');
  }, 100);

  // 1) Geocode
  let geo;
  try {
    geo = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(loc)}&format=json`
    ).then(r => r.json());
    if (!geo[0]) throw new Error('Location not found');
  } catch (e) {
    clearInterval(spin);
    term.write('\x1b[2K\r');
    term.writeln('✖ ' + e.message);
    return;
  }
  const { lat, lon } = geo[0];

  const today = new Date().toISOString().split('T')[0];

  // 2) Fetch weather & marine
  let weatherRes, marineRes;
  try {
    [weatherRes, marineRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${lat}&longitude=${lon}` +
        `&current_weather=true` +
        `&hourly=wind_speed_10m,weathercode` +
        `&start_date=${today}&end_date=${today}` +
        `&timezone=auto`
      ).then(r => r.json()),
      fetch(
        `https://marine-api.open-meteo.com/v1/marine?` +
        `latitude=${lat}&longitude=${lon}` +
        `&current=sea_level_height_msl,wave_height,sea_surface_temperature` +
        `&hourly=sea_level_height_msl,wave_height,sea_surface_temperature` +
        `&start_date=${today}&end_date=${today}` +
        `&timezone=auto`
      ).then(r => r.json())
    ]);
  } catch (e) {
    clearInterval(spin);
    term.write('\x1b[2K\r');
    term.writeln('✖ Failed to fetch surf data');
    return;
  }

  // stop spinner & clear that line
  clearInterval(spin);
  term.write('\x1b[2K\r');

  // 3) Parse current weather
  const cw = weatherRes.current_weather;
  const [wIcon, wDesc] = codes[cw.weathercode] || ['❓','Unknown'];
  const wind = cw.windspeed;

  // 4) Parse marine snapshot
  const mc = marineRes.current || {};

  // 5) Compute today's high/low tides
  const times = marineRes.hourly.time;
  const tides = marineRes.hourly.sea_level_height_msl;
  let idxMax = 0, idxMin = 0;
  tides.forEach((h, idx) => {
    if (h > tides[idxMax]) idxMax = idx;
    if (h < tides[idxMin]) idxMin = idx;
  });
  const timeOfMax = new Date(times[idxMax]).getHours().toString().padStart(2,'0') + ':00';
  const timeOfMin = new Date(times[idxMin]).getHours().toString().padStart(2,'0') + ':00';
  const maxTide = tides[idxMax].toFixed(2);
  const minTide = tides[idxMin].toFixed(2);

  // 6) Output summary
  term.writeln(`Tides: ⬆️ ${maxTide} m at ${timeOfMax} • ⬇️ ${minTide} m at ${timeOfMin}`);
  term.writeln(`Wind: ${wind.toFixed(1)} km/h • Water: ${mc.sea_surface_temperature?.toFixed(1) ?? '–'}°C`);
  term.writeln(`Waves: ${mc.wave_height?.toFixed(1) ?? '–'} m • Weather: ${wIcon} ${wDesc}`);

  // 7) Draw an ASCII tide graph for the day
  //    Map tide heights to blocks ▁▂▃▄▅▆▇█
  const blocks = ['▁','▂','▃','▄','▅','▆','▇','█'];
  const minT = Math.min(...tides), maxT = Math.max(...tides);
  const range = maxT - minT || 1;
  const spark = tides.map(h => {
    const idx = Math.floor((h - minT) / range * (blocks.length - 1));
    return blocks[idx];
  }).join('');

  // Mark current position
  const nowISO = cw.time.split(':00')[0];
  const nowIdx = times.findIndex(t => t.startsWith(nowISO));
  const markerLine = ' '.repeat(nowIdx) + '▲ now';

  term.writeln(`Graph: ${spark}`);
  term.writeln(`       ${markerLine}`);
}
