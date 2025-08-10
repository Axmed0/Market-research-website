(function(){
  const $ = s => document.querySelector(s);
  const page = document.body.dataset.page;
  const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  function formatDate(iso){
    try{ return new Date(iso).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'2-digit'});}catch(e){return iso;}
  }
  async function fetchJSON(url){
    const res = await fetch(url, {cache:'no-store'});
    if(!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
    return await res.json();
  }

  async function fetchAndRenderArticles(){
    const container = $('#articles-container');
    try{
      const items = await fetchJSON('content.json');
      items.sort((a,b)=>new Date(b.date)-new Date(a.date));
      container.innerHTML = items.map(a => {
        const href = `article.html?slug=${encodeURIComponent(a.slug)}`;
        return `<div class='article-item'>
          <h3><a href='${href}'>${a.title}</a></h3>
          <p>${a.category} • ${formatDate(a.date)}</p>
        </div>`;
      }).join('');
    }catch(e){
      container.innerHTML = `<div class='article-item'><h3>No articles yet</h3><p>Publish via /admin to populate this list.</p></div>`;
      console.error(e);
    }
  }

  async function fetchAndRenderArticle(){
    const params = new URL(location.href).searchParams;
    const slug = params.get('slug');
    const titleEl = $('#article-title'), metaEl = $('#article-meta'), bodyEl = $('#article-body');
    if(!slug){ titleEl.textContent='Article not found'; return; }
    try{
      const items = await fetchJSON('content.json');
      const found = items.find(a => a.slug === slug);
      if(!found) throw new Error('Slug not found');
      titleEl.textContent = found.title;
      metaEl.textContent = `${found.category} • ${formatDate(found.date)}`;
      const md = await fetch(found.path, {cache:'no-store'}).then(r=>r.text());
      bodyEl.innerHTML = window.marked ? marked.parse(md) : md;
    }catch(e){
      titleEl.textContent = 'Article not available';
      metaEl.textContent = '';
      bodyEl.innerHTML = '<p>Try again later.</p>';
      console.error(e);
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    if(page==='home') fetchAndRenderArticles();
    if(page==='article') fetchAndRenderArticle();
  });
})();