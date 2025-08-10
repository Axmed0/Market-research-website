(function(){
  const $ = s => document.querySelector(s);
  const page = document.body.dataset.page;
  const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  function fmtDate(iso){
    try{ return new Date(iso).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'2-digit'});}catch(e){return iso;}
  }
  async function fetchJSON(url){
    const res = await fetch(url, {cache:'no-store'});
    if(!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
    return await res.json();
  }

  // Render a list of items into a container
  function renderList(containerSel, items, emptyText){
    const el = $(containerSel);
    if(!el) return;
    if(!items.length){
      el.innerHTML = `<div class="item"><p class="summary">${emptyText}</p></div>`;
      return;
    }
    el.innerHTML = items.map(a => {
      const href = `article.html?slug=${encodeURIComponent(a.slug)}`;
      return `<div class="item">
        <p class="date">${fmtDate(a.date)}</p>
        <h3 class="title"><a href="${href}">${a.title}</a></h3>
        <p class="summary">${a.summary || ""}</p>
      </div>`;
    }).join('');
  }

  async function initHome(){
    try{
      const all = await fetchJSON('content.json');
      // sort newest first
      all.sort((a,b)=>new Date(b.date)-new Date(a.date));
      const market = all.filter(a => a.category === 'Market Insights');
      const equity = all.filter(a => a.category === 'Equity Research');
      const trade  = all.filter(a => a.category === 'Trade Ideas');

      renderList('#market-insights-list', market, 'No recent research available in this category.');
      renderList('#equity-research-list', equity, 'No recent research available in this category.');
      renderList('#trade-ideas-list', trade, 'No recent research available in this category.');
    }catch(e){
      console.error(e);
      ['#market-insights-list','#equity-research-list','#trade-ideas-list'].forEach(sel=>{
        const el = $(sel); if(el) el.innerHTML = `<div class="item"><p class="summary">Content unavailable. Please check again later.</p></div>`;
      });
    }
  }

  async function initArticle(){
    const params = new URL(location.href).searchParams;
    const slug = params.get('slug');
    const titleEl = $('#article-title'), metaEl = $('#article-meta'), bodyEl = $('#article-body');
    if(!slug){ titleEl.textContent='Article not found'; return; }

    try{
      const list = await fetchJSON('content.json');
      const found = list.find(a => a.slug === slug);
      if(!found) throw new Error('Slug not in content.json');
      document.title = `Lumora — ${found.title}`;
      titleEl.textContent = found.title;
      metaEl.textContent = `${found.category} • ${fmtDate(found.date)}`;

      const md = await fetch(found.path, {cache:'no-store'}).then(r=>r.text());
      bodyEl.innerHTML = window.marked ? marked.parse(md) : md;
    }catch(e){
      console.error(e);
      titleEl.textContent = 'Article not available';
      metaEl.textContent = '';
      bodyEl.innerHTML = '<p>Try again later.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    if(page==='home') initHome();
    if(page==='article') initArticle();
  });
})();