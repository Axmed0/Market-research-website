(function(){
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Utility: fetch content.json (built by CI)
  async function loadContent(){
    const res = await fetch('content.json', { cache: 'no-store' });
    if (!res.ok) return { posts: [] };
    return await res.json();
  }

  function formatDate(iso){
    const d = new Date(iso);
    const fmt = new Intl.DateTimeFormat('en-GB', { year:'numeric', month:'long', day:'2-digit' });
    return fmt.format(d);
  }

  function renderList(listEl, posts){
    listEl.innerHTML = '';
    if (!posts || posts.length === 0){
      listEl.innerHTML = '<div class="post"><p class="post-summary">No recent research available in this category.</p></div>';
      return;
    }
    posts
      .sort((a,b)=> new Date(b.date) - new Date(a.date))
      .slice(0,6)
      .forEach(p => {
        const div = document.createElement('div');
        div.className = 'post';
        const url = `/article.html?slug=${encodeURIComponent(p.slug)}`;
        div.innerHTML = `
          <span class="post-date">${formatDate(p.date)}</span>
          <h3 class="post-title"><a href="${url}">${p.title}</a></h3>
          <p class="post-summary">${escapeHtml(p.summary || '')}</p>
        `;
        listEl.appendChild(div);
      });
  }

  function escapeHtml(s){
    return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  }

  async function initHome(){
    const content = await loadContent();
    const posts = content.posts || [];

    const mi = posts.filter(p => p.category === 'Market Insights');
    const er = posts.filter(p => p.category === 'Equity Research');
    const ti = posts.filter(p => p.category === 'Trade Ideas');

    const byId = id => document.getElementById(id);
    renderList(byId('market-insights-list'), mi);
    renderList(byId('equity-research-list'), er);
    renderList(byId('trade-ideas-list'), ti);
  }

  async function initArticle(){
    const params = new URLSearchParams(location.search);
    const slug = params.get('slug');
    if (!slug) return;

    const { posts } = await loadContent();
    const post = (posts || []).find(p => p.slug === slug);
    if (!post){
      document.getElementById('article-title').textContent = 'Not found';
      return;
    }

    document.title = `Lumora — ${post.title}`;
    document.getElementById('article-title').textContent = post.title;
    document.getElementById('article-summary').textContent = post.summary || '';
    document.getElementById('article-meta').textContent = `${formatDate(post.date)} · ${post.category}`;

    const bodyEl = document.getElementById('article-body');
    if (window.marked){
      bodyEl.innerHTML = marked.parse(post.body || '');
    } else {
      bodyEl.textContent = post.body || '';
    }
  }

  // Router
  if (document.getElementById('market-insights-list')) initHome();
  if (document.getElementById('article-body')) initArticle();
})();