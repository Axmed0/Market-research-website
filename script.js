// ===== Helper utilities =====
const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

function setBodyScrollLocked(locked){ document.body.style.overflow = locked ? 'hidden' : ''; }

function getQueryParam(key){
  const url = new URL(window.location.href);
  return url.searchParams.get(key);
}

async function loadArticles(){
  const res = await fetch('data/articles.json', {cache:'no-store'});
  return await res.json();
}

function articleCard(a){
  return `
  <div class="col-12 col-md-6 col-lg-4" data-category="${a.category}">
    <article class="card h-100 card-raise">
      <img src="${a.image}" class="card-img-top" alt="${a.title}">
      <div class="card-body">
        <div class="d-flex gap-2 mb-2">
          ${(a.tags||[]).map(t => `<span class="badge text-bg-primary-soft">${t}</span>`).join('')}
        </div>
        <h3 class="h5 card-title"><a href="article.html?slug=${encodeURIComponent(a.slug)}" class="stretched-link text-decoration-none">${a.title}</a></h3>
        <p class="card-text text-muted small mb-0">Published ${a.date}</p>
      </div>
    </article>
  </div>`;
}

function renderArticles(list, {category='all', query=''} = {}){
  let filtered = list.slice();
  if (category !== 'all') filtered = filtered.filter(a => a.category === category);
  if (query){
    const q = query.toLowerCase();
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.summary||'').toLowerCase().includes(q) ||
      (a.tags||[]).join(' ').toLowerCase().includes(q)
    );
  }
  const grid = qs('#insightsGrid');
  if (!grid) return;
  grid.innerHTML = filtered.map(articleCard).join('') || `<div class="text-center text-muted">No results found.</div>`;
}

// ===== Header: search redirect =====
function initHeaderSearch(){
  const form = qs('#headerSearch');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = (new FormData(form)).get('q') || '';
    window.location.href = 'insights.html?q=' + encodeURIComponent(q);
  });
}

// ===== Mobile menu =====
function initMobileMenu(){
  const toggle = qs('#menuToggle'), closeBtn = qs('#menuClose'), menu = qs('#mobileMenu');
  if (!menu) return;
  function close(){ menu.classList.remove('show'); menu.setAttribute('aria-hidden','true'); setBodyScrollLocked(false); toggle?.setAttribute('aria-expanded','false'); }
  function open(){ menu.classList.add('show'); menu.setAttribute('aria-hidden','false'); setBodyScrollLocked(true); toggle?.setAttribute('aria-expanded','true'); }
  toggle?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  menu.addEventListener('click', (e)=>{ if (e.target === menu) close(); });
  qsa('#mobileMenu a.mobile-link').forEach(a => a.addEventListener('click', close));
}

// ===== Newsletter storage + CSV export =====
function initNewsletter(){
  const form = qs('#newsletterForm');
  const exportBtn = qs('#exportSubscribers');
  if (form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const arr = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
      arr.push({...data, ts: new Date().toISOString()});
      localStorage.setItem('newsletterSubscribers', JSON.stringify(arr));
      qs('#newsletterThanks')?.classList.remove('d-none');
      form.reset();
    });
  }
  if (exportBtn){
    exportBtn.addEventListener('click', ()=>{
      const arr = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
      const header = ['firstName','lastName','email','ts'];
      const rows = [header.join(',')].concat(arr.map(o => header.map(k => (o[k]||'').toString().replace(/,/g,' ')).join(',')));
      const blob = new Blob([rows.join('\n')], {type:'text/csv'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'newsletter-subscribers.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }
}

// ===== Experts form: stepper + mailto + JSON receipt =====
function initExperts(){
  const form = qs('#expertsForm');
  const step2 = qs('#expertsStep2');
  const next = qs('#expertsNext');
  const back = qs('#expertsBack');
  const submit = qs('#expertsSubmit');
  const thanks = qs('#expertsThanks');
  const dl = qs('#expertsDownload');
  const emailBtn = qs('#expertsEmail');

  function validate(){
    let ok = true;
    qsa('#expertsForm input[required]').forEach(inp=>{
      if(!inp.value.trim()){ inp.classList.add('is-invalid'); ok=false; } else { inp.classList.remove('is-invalid'); }
    });
    const email = qs('#email');
    if (email && !/^\S+@\S+\.\S+$/.test(email.value)){ email.classList.add('is-invalid'); ok=false; }
    return ok;
  }

  next?.addEventListener('click', ()=>{
    if (!validate()) return;
    form.classList.add('d-none');
    step2.classList.remove('d-none');
  });
  back?.addEventListener('click', ()=>{
    step2.classList.add('d-none');
    form.classList.remove('d-none');
  });
  submit?.addEventListener('click', ()=>{
    // collect data
    const step1 = Object.fromEntries(new FormData(form).entries());
    const step2Data = { details: (qs('#expertsDetails')?.value || '').trim() };
    const record = {...step1, ...step2Data, ts:new Date().toISOString()};

    // store
    const arr = JSON.parse(localStorage.getItem('expertLeads') || '[]');
    arr.push(record);
    localStorage.setItem('expertLeads', JSON.stringify(arr));

    // show thanks
    step2.classList.add('d-none');
    thanks.classList.remove('d-none');

    // setup email button
    if (emailBtn){
      const subject = encodeURIComponent('Lumora enquiry from ' + (record.firstName||''));
      const body = encodeURIComponent(`Name: ${record.firstName||''} ${record.lastName||''}\nEmail: ${record.email||''}\nPhone: ${record.phone||''}\n\nDetails:\n${record.details||''}`);
      emailBtn.href = `mailto:hello@example.com?subject=${subject}&body=${body}`;
    }

    // setup download
    if (dl){
      const blob = new Blob([JSON.stringify(record,null,2)], {type:'application/json'});
      dl.href = URL.createObjectURL(blob);
      dl.download = `lead-${Date.now()}.json`;
    }
  });
}

// ===== Login (localStorage fake login) =====
function initLogin(){
  const loginForm = qs('#loginForm');
  const logoutBtn = qs('#logoutBtn');
  const status = qs('#loginStatus');

  function updateStatus(){
    const user = JSON.parse(localStorage.getItem('lumoraUser') || 'null');
    if (status){
      status.textContent = user ? `Logged in as ${user.email}` : 'Not logged in';
    }
  }

  loginForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm).entries());
    localStorage.setItem('lumoraUser', JSON.stringify({email:data.email, ts:new Date().toISOString()}));
    updateStatus();
    alert('Logged in (locally).');
  });
  logoutBtn?.addEventListener('click', ()=>{
    localStorage.removeItem('lumoraUser'); updateStatus(); alert('Logged out.');
  });

  updateStatus();
}

// ===== Insights page logic =====
async function initInsightsPage(){
  const isInsights = /insights\.html$/.test(location.pathname) || qs('#insightsGrid');
  if (!isInsights) return;
  const list = await loadArticles();
  const q = getQueryParam('q') || '';
  const cat = getQueryParam('cat') || 'all';
  renderArticles(list, {category:cat, query:q});

  // tabs
  qsa('.insights-tabs .nav-link').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      qsa('.insights-tabs .nav-link').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderArticles(list, {category: btn.getAttribute('data-category'), query: qs('#searchInsights')?.value || ''});
    });
  });

  // search box
  qs('#searchInsights')?.addEventListener('input', (e)=>{
    const active = qsa('.insights-tabs .nav-link').find(b=>b.classList.contains('active'));
    const cat = active ? active.getAttribute('data-category') : 'all';
    renderArticles(list, {category:cat, query:e.target.value});
  });
}

// ===== Article page =====
async function initArticlePage(){
  if (!/article\.html$/.test(location.pathname)) return;
  const slug = getQueryParam('slug');
  const list = await loadArticles();
  const article = list.find(a => a.slug === slug);
  const container = qs('#articleContainer');
  if (!article){ container.innerHTML = '<div class="alert alert-warning">Article not found.</div>'; return; }
  document.title = 'Lumora — ' + article.title;
  container.innerHTML = `
    <div class="container">
      <nav class="mb-3"><a href="insights.html" class="link-arrow">&larr; Back to Market Insights</a></nav>
      <h1 class="mb-2">${article.title}</h1>
      <div class="text-muted mb-3">${article.date} • ${article.tags.join(', ')}</div>
      <img src="${article.image}" class="img-fluid rounded mb-4" alt="${article.title}">
      <div class="lead">${article.summary}</div>
      <hr class="my-4"/>
      <div>${article.content_html}</div>
    </div>`;
}

// ===== Index page: populate featured insights =====
async function initIndexPage(){
  if (!/index\.html$/.test(location.pathname)) return;
  const grid = qs('#insightsGrid'); if (!grid) return;
  const list = await loadArticles();
  renderArticles(list, {category:'all', query:''});
}

// ===== Boot =====
window.addEventListener('DOMContentLoaded', ()=>{
  initHeaderSearch();
  initMobileMenu();
  initNewsletter();
  initExperts();
  initLogin();
  initInsightsPage();
  initArticlePage();
  initIndexPage();
  // year
  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
});
