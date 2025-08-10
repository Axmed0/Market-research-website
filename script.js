(function(){
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const nav = document.getElementById('site-nav');
  const toggle = document.getElementById('menu-toggle');
  if (toggle && nav){
    toggle.addEventListener('click', ()=>{
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  async function loadContent(){
    try{
      const res = await fetch('content.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('no content');
      const data = await res.json();
      return data.posts || [];
    }catch(e){ return []; }
  }

  const fmt = new Intl.DateTimeFormat('en-GB', { year:'numeric', month:'long', day:'2-digit' });
  const byDate = (a,b)=> new Date(b.date) - new Date(a.date);

  function card(post){
    const url = `article.html?slug=${encodeURIComponent(post.slug)}`;
    return `
      <article class="card" data-title="${escapeHtml(post.title)}" data-summary="${escapeHtml(post.summary||'')}" data-category="${escapeHtml(post.category)}">
        <div class="date">${fmt.format(new Date(post.date))}</div>
        <h3 class="title"><a href="${url}">${escapeHtml(post.title)}</a></h3>
        <p class="summary">${escapeHtml(post.summary||'')}</p>
        <span class="tag">${escapeHtml(post.category)}</span>
      </article>`;
  }
  function escapeHtml(s){return (s||'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

  function renderInto(el, arr){
    if (!el) return;
    if (!arr || arr.length===0){
      el.innerHTML = `<p class="summary">No recent research available in this category.</p>`;
      return;
    }
    el.innerHTML = arr.sort(byDate).slice(0,6).map(card).join('');
  }

  function attachSearch(input, container){
    if (!input || !container) return;
    input.addEventListener('input', ()=>{
      const q = input.value.trim().toLowerCase();
      for (const c of container.querySelectorAll('.card')){
        const hay = (c.dataset.title + ' ' + c.dataset.summary + ' ' + c.dataset.category).toLowerCase();
        c.style.display = hay.includes(q) ? '' : 'none';
      }
    });
  }

  // Homepage init
  async function initHome(){
    const posts = await loadContent();
    const mi = posts.filter(p=>p.category==='Market Insights');
    const er = posts.filter(p=>p.category==='Equity Research');
    const ti = posts.filter(p=>p.category==='Trade Ideas');
    renderInto(document.getElementById('market-insights-list'), mi);
    renderInto(document.getElementById('equity-research-list'), er);
    renderInto(document.getElementById('trade-ideas-list'), ti);

    attachSearch(document.getElementById('global-search'), document.body);
  }

  // Category page init
  async function initCategory(){
    const html = document.documentElement;
    const cat = html.getAttribute('data-category');
    if (!cat) return;
    const posts = await loadContent();
    const list = posts.filter(p=>p.category===cat).sort(byDate);
    const container = document.getElementById('page-list');
    if (container) container.innerHTML = list.map(card).join('') || '<p class="summary">No posts yet.</p>';
    attachSearch(document.getElementById('page-search'), container);
  }

  // Article page init
  async function initArticle(){
    const bodyEl = document.getElementById('article-body');
    if (!bodyEl) return;
    const params = new URLSearchParams(location.search);
    const slug = params.get('slug');
    const posts = await loadContent();
    const post = posts.find(p=>p.slug===slug);
    if (!post){
      document.getElementById('article-title').textContent = 'Not found';
      return;
    }
    document.title = `Lumora — ${post.title}`;
    document.getElementById('article-title').textContent = post.title;
    document.getElementById('article-summary').textContent = post.summary||'';
    document.getElementById('article-meta').textContent = `${fmt.format(new Date(post.date))} · ${post.category}`;
    if (window.marked) bodyEl.innerHTML = marked.parse(post.body||''); else bodyEl.textContent = post.body||'';
  }

  if (document.getElementById('market-insights-list')) initHome();
  if (document.documentElement.getAttribute('data-category')) initCategory();
  if (document.getElementById('article-body')) initArticle();
})();