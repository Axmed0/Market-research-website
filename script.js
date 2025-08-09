(function(){
  const $ = (s)=>document.querySelector(s);
  const qsa = (s)=>Array.from(document.querySelectorAll(s));
  const page = document.body.dataset.page;
  const year = document.getElementById('year'); if (year) year.textContent = new Date().getFullYear();

  // ---- Mode detection
  window.LUMORA = window.LUMORA || {};
  LUMORA.firebaseConfig = LUMORA.firebaseConfig || {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  const hasFirebase = LUMORA.firebaseConfig.apiKey && LUMORA.firebaseConfig.apiKey !== "YOUR_API_KEY";

  let auth=null, db=null, storage=null;
  LUMORA.mode = hasFirebase ? 'firebase' : 'static';
  LUMORA.isWriter = false;
  LUMORA.user = null;

  function renderList(items){
    const grid = $('#listGrid'); if (!grid) return;
    const s = ($('#search')?.value || '').toLowerCase();
    const filtered = items.filter(a => (a.title||'').toLowerCase().includes(s) || (a.summary||'').toLowerCase().includes(s) || (a.tags||[]).join(' ').toLowerCase().includes(s));
    grid.innerHTML = filtered.map(a => `
      <div class="col-12">
        <article class="card p-4">
          <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
            <div>
              <div class="small-muted mb-1">${(a.tags||[]).map(t=>`<span class="badge-soft me-1">${t}</span>`).join('')}</div>
              <h3 class="h5 m-0"><a class="text-plain" href="article.html?slug=${encodeURIComponent(a.slug)}">${a.title}</a></h3>
              <div class="small-muted">${a.date}</div>
              <p class="small-muted mt-2 mb-0">${a.summary||''}</p>
            </div>
            <div><a class="btn btn-outline btn-pill" href="article.html?slug=${encodeURIComponent(a.slug)}">Open</a></div>
          </div>
        </article>
      </div>
    `).join('') || `<div class="small-muted">No articles yet.</div>`;
  }

  function renderArticle(a){
    const c = $('#articleContainer'); if (!c) return;
    document.title = `Lumora — ${a.title}`;
    c.innerHTML = `
      <div class="container container-narrow">
        <div class="kicker mb-2">${a.type === 'equity' ? 'Equity Research' : 'Market Insights'}</div>
        <h1 class="mb-2">${a.title}</h1>
        <div class="small-muted mb-3">${a.date} · ${(a.tags||[]).join(', ')}</div>
        <div class="lead">${a.summary||''}</div>
        <hr class="my-4">
        <div>${a.content_html || a.contentHtml || ''}</div>
        <div class="mt-4"><a class="btn btn-outline btn-pill" href="${a.type==='equity'?'equity.html':'insights.html'}">Back</a></div>
      </div>`;
  }

  // -------- Static mode --------
  async function staticList(type){
    const r = await fetch('data/articles.json', {cache:'no-store'});
    const all = await r.json();
    const items = all.filter(a => a.type === type);
    renderList(items);
    $('#search')?.addEventListener('input', ()=>renderList(items));
  }
  async function staticArticle(){
    const slug = new URL(location.href).searchParams.get('slug');
    const r = await fetch('data/articles.json', {cache:'no-store'});
    const all = await r.json();
    const a = all.find(x => x.slug === slug);
    if (!a){ $('#articleContainer').innerHTML='<div class="container container-narrow"><div class="alert alert-warning">Article not found.</div></div>'; return; }
    renderArticle(a);
  }
  function staticContact(){
    const form = $('#contactForm'), thanks = $('#contactThanks');
    form?.addEventListener('submit', (e)=>{
      e.preventDefault();
      // store locally for now
      const arr = JSON.parse(localStorage.getItem('contactMsgs')||'[]');
      arr.push(Object.fromEntries(new FormData(form).entries()));
      localStorage.setItem('contactMsgs', JSON.stringify(arr));
      form.reset(); thanks.classList.remove('hidden');
    });
  }
  function staticLoginGuard(){
    if (page==='login' || page==='dashboard' || page==='editor'){
      $('#authError')?.classList.remove('hidden');
      $('#authError').textContent = 'Login is disabled in static mode. Add Firebase config in script.js to enable.';
      $('#modeWarn')?.classList.remove('hidden');
    }
  }

  // -------- Firebase mode --------
  async function initFirebase(){
    if (!hasFirebase) return;
    firebase.initializeApp(LUMORA.firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();

    function updateNav(user){
      const navLogin = document.getElementById('navLogin');
      const navLogout = document.getElementById('navLogout');
      const navDash = document.getElementById('navDashboard');
      if (user){
        navLogin?.classList.add('hidden');
        navLogout?.classList.remove('hidden');
        if (LUMORA.isWriter) navDash?.classList.remove('hidden');
      } else {
        navLogin?.classList.remove('hidden');
        navLogout?.classList.add('hidden');
        navDash?.classList.add('hidden');
      }
    }
    async function fetchRole(uid){
      try{
        const doc = await db.collection('users').doc(uid).get();
        LUMORA.isWriter = !!(doc.exists && doc.data().role === 'writer');
      }catch(e){ LUMORA.isWriter = False; }
    }

    auth.onAuthStateChanged(async (user)=>{
      LUMORA.user = user;
      if (user) await fetchRole(user.uid);
      updateNav(user);
      runPage();
    });
    LUMORA.authLogout = () => auth.signOut();
  }

  async function fbList(type){
    const grid = $('#listGrid'), search = $('#search');
    let snap = await db.collection('articles').where('type','==',type).where('published','==',true).orderBy('date','desc').get();
    let items = snap.docs.map(d => ({id:d.id, ...d.data(), date:(d.data().date?.toDate?.()||new Date()).toISOString().slice(0,10)}));
    const render = (q='')=>{
      const s = q.toLowerCase();
      const f = items.filter(a => (a.title||'').toLowerCase().includes(s) || (a.summary||'').toLowerCase().includes(s) || (a.tags||[]).join(' ').toLowerCase().includes(s));
      renderList(f);
    };
    render('');
    search?.addEventListener('input', e => render(e.target.value));
  }

  async function fbArticle(){
    const slug = new URL(location.href).searchParams.get('slug');
    const q = await db.collection('articles').where('slug','==',slug).limit(1).get();
    if (q.empty){ $('#articleContainer').innerHTML='<div class="container container-narrow"><div class="alert alert-warning">Article not found.</div></div>'; return; }
    const a = q.docs[0].data();
    a.date = (a.date?.toDate?.()||new Date()).toISOString().slice(0,10);
    renderArticle(a);
  }

  function fbContact(){
    const form = $('#contactForm'), thanks = $('#contactThanks');
    form?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      data.ts = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('contactMessages').add(data);
      form.reset(); thanks.classList.remove('hidden');
    });
  }

  function fbLogin(){
    const form = $('#loginForm'), err = $('#authError');
    $('#goSignup')?.addEventListener('click', (e)=>{
      e.preventDefault();
      const email = prompt('Enter email for writer account:');
      const pass = prompt('Enter password:');
      if (!email || !pass) return;
      auth.createUserWithEmailAndPassword(email, pass)
        .then(async cred => {
          await db.collection('users').doc(cred.user.uid).set({ email, role:'reader', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
          alert('Account created. Ask admin to set role to writer.');
        }).catch(e => { err.classList.remove('hidden'); err.textContent = e.message; });
    });
    form?.addEventListener('submit', (e)=>{
      e.preventDefault();
      const {email, password} = Object.fromEntries(new FormData(form).entries());
      auth.signInWithEmailAndPassword(email, password).then(()=>{
        location.href = 'dashboard.html';
      }).catch(e => { err.classList.remove('hidden'); err.textContent = e.message; });
    });
  }

  async function fbDashboard(){
    if (!LUMORA.user){ location.href='login.html?next=dashboard.html'; return; }
    const warn = $('#modeWarn'); warn?.classList.add('hidden');
    const list = $('#myArticles'); const empty = $('#empty');
    const q = await db.collection('articles').where('authorId','==',LUMORA.user.uid).orderBy('date','desc').get();
    const items = q.docs.map(d=>({id:d.id, ...d.data(), date:(d.data().date?.toDate?.()||new Date()).toISOString().slice(0,10)}));
    if (!items.length){ empty.classList.remove('hidden'); }
    list.innerHTML = items.map(a => `
      <tr>
        <td><a class="text-plain" href="editor.html?id=${a.id}">${a.title}</a></td>
        <td>${a.type}</td>
        <td>${a.date}</td>
        <td>${a.published ? 'Yes' : 'No'}</td>
        <td>
          <a class="btn btn-sm btn-outline me-1" href="editor.html?id=${a.id}">Edit</a>
          <a class="btn btn-sm btn-outline" href="article.html?slug=${encodeURIComponent(a.slug)}" target="_blank">View</a>
        </td>
      </tr>
    `).join('');
  }

  async function fbEditor(){
    if (!LUMORA.user){ location.href='login.html?next=editor.html'; return; }
    const warn = $('#modeWarn'); warn?.classList.add('hidden');
    const params = new URL(location.href).searchParams;
    const id = params.get('id');
    const form = $('#editForm');
    const delBtn = $('#deleteBtn');

    let ref = null, data={};
    if (id){
      ref = db.collection('articles').doc(id);
      const doc = await ref.get();
      if (doc.exists) data = doc.data();
    }

    // Fill form
    if (data.title) $('#title').value = data.title;
    if (data.slug) $('#slug').value = data.slug;
    $('#type').value = data.type || 'insights';
    $('#tags').value = (data.tags||[]).join(', ');
    $('#summary').value = data.summary || '';
    $('#contentHtml').value = data.contentHtml || '';
    $('#published').checked = !!data.published;

    // Save
    form?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const vals = Object.fromEntries(new FormData(form).entries());
      const payload = {
        title: vals.title.trim(),
        type: vals.type,
        slug: (vals.slug||vals.title).trim().toLowerCase().replace(/\s+/g,'-'),
        tags: (vals.tags||'').split(',').map(s=>s.trim()).filter(Boolean),
        summary: vals.summary.trim(),
        contentHtml: vals.contentHtml,
        published: vals.published === 'on',
        authorId: LUMORA.user.uid,
        authorEmail: LUMORA.user.email,
        date: firebase.firestore.FieldValue.serverTimestamp()
      };
      if (ref){ await ref.update(payload); }
      else{
        const exists = await db.collection('articles').where('slug','==',payload.slug).limit(1).get();
        if (!exists.empty){ alert('Slug exists. Choose another.'); return; }
        ref = await db.collection('articles').add(payload);
      }
      location.href='dashboard.html';
    });

    // Delete
    delBtn?.addEventListener('click', async ()=>{
      if (ref && confirm('Delete this article?')){
        await ref.delete();
        location.href='dashboard.html';
      }
    });
  }

  // -------- Router --------
  function runPage(){
    if (LUMORA.mode === 'static'){
      if (page==='insights') staticList('insights');
      if (page==='equity') staticList('equity');
      if (page==='article') staticArticle();
      if (page==='contact') staticContact();
      staticLoginGuard();
    } else {
      if (page==='insights') fbList('insights');
      if (page==='equity') fbList('equity');
      if (page==='article') fbArticle();
      if (page==='contact') fbContact();
      if (page==='login') fbLogin();
      if (page==='dashboard') fbDashboard();
      if (page==='editor') fbEditor();
    }
  }

  if (hasFirebase) { initFirebase(); } else { runPage(); }
})();