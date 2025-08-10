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

  async function loadPosts(){
    try {
      const res = await fetch('content.json', { cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.posts || []).sort((a,b)=> new Date(b.date) - new Date(a.date));
    } catch(e){ return []; }
  }

  const fmt = new Intl.DateTimeFormat('en-GB', { year:'numeric', month:'short', day:'2-digit' });
  function row(post){
    const url = `article.html?slug=${encodeURIComponent(post.slug)}`;
    return `
      <div class="row" data-title="${escapeHtml(post.title)}" data-summary="${escapeHtml(post.summary||'')}" data-category="${escapeHtml(post.category)}">
        <div class="date">${fmt.format(new Date(post.date))}</div>
        <div>
          <h3 class="title"><a href="${url}">${escapeHtml(post.title)}</a></h3>
          <p class="summary">${escapeHtml(post.summary||'')}</p>
        </div>
      </div>`;
  }
  function escapeHtml(s){return (s||'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#39;"}[c]));}

  function attachSearch(input, container){
    if (!input || !container) return;
    input.addEventListener('input', ()=>{
      const q = input.value.trim().toLowerCase();
      container.querySelectorAll('.row').forEach(el=>{
        const hay = (el.dataset.title + ' ' + el.dataset.summary + ' ' + el.dataset.category).toLowerCase();
        el.style.display = hay.includes(q) ? '' : 'none';
      });
    });
  }

  async function initHome(){
    const listEl = document.getElementById('recent-list');
    if (!listEl) return;
    const posts = await loadPosts();
    listEl.innerHTML = posts.slice(0,12).map(row).join('') || '<p class="summary">No recent articles yet.</p>';
  }

  async function initCategory(){
    const html = document.documentElement;
    const cat = html.getAttribute('data-category');
    if (!cat) return;
    const listEl = document.getElementById('page-list');
    const posts = await loadPosts();
    const filtered = posts.filter(p=>p.category===cat);
    listEl.innerHTML = filtered.map(row).join('') || '<p class="summary">No articles in this category yet.</p>';
    attachSearch(document.getElementById('page-search'), listEl);
  }

  async function initArticle(){
    const bodyEl = document.getElementById('article-body');
    if (!bodyEl) return;
    const params = new URLSearchParams(location.search);
    const slug = params.get('slug');
    const posts = await loadPosts();
    const post = posts.find(p=>p.slug===slug);
    if (!post){
      document.getElementById('article-title').textContent = 'Not found';
      return;
    }
    document.title = `Lumora — ${post.title}`;
    document.getElementById('article-title').textContent = post.title;
    document.getElementById('article-summary').textContent = post.summary || '';
    document.getElementById('article-meta').textContent = `${fmt.format(new Date(post.date))} · ${post.category}`;
    if (window.marked){
      document.getElementById('article-body').innerHTML = marked.parse(post.body || '');
    } else {
      bodyEl.textContent = post.body || '';
    }
  }

  if (document.getElementById('recent-list')) initHome();
  if (document.documentElement.getAttribute('data-category')) initCategory();
  if (document.getElementById('article-body')) initArticle();
})();