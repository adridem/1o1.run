// commands/news.js
export async function news(term, catArg) {
  const frames = ['-','\\','/','|'];
  let i = 0;
  const cat = (catArg||'').trim().toLowerCase();

  // newline + spinner
  term.writeln('');
  term.write('1o1> [' + frames[0] + ']');
  const spin = setInterval(()=>{
    i++;
    term.write('\r1o1> [' + frames[i % frames.length] + ']');
  }, 100);

  // fetch HN items
  let items = [];
  try {
    if (!cat) {
      // top stories
      const ids = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
                        .then(r => r.json());
      items = await Promise.all(
        ids.slice(0, 5).map(id =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
            .then(r => r.json())
        )
      );
    } else {
      // search stories
      const data = await fetch(
        `https://hn.algolia.com/api/v1/search?` +
        `query=${encodeURIComponent(cat)}&tags=story&hitsPerPage=5`
      ).then(r => r.json());
      items = data.hits || [];
    }
  } catch (e) {
    // ignore, will handle below
  }

  clearInterval(spin);
  // clear spinner line, move to next
  term.write('\r1o1>    ');
  term.writeln('');

  // output
  if (!items.length) {
    term.writeln('1o1> ✖ No items found');
  } else {
    items.slice(0,5).forEach((it, idx) => {
      term.writeln(`1o1> [${idx+1}] ${it.title}`);
    });
  }
}
