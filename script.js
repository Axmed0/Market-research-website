// Utility: toggle body scroll
function setBodyScrollLocked(locked){
  document.body.style.overflow = locked ? 'hidden' : '';
}

// ===== Header search toggle =====
const searchToggle = document.getElementById('searchToggle');
const searchBar = document.getElementById('searchBar');
if (searchToggle && searchBar){
  searchToggle.addEventListener('click', () => {
    const showing = searchBar.classList.toggle('show');
    searchBar.setAttribute('aria-hidden', String(!showing));
    if (showing){
      // focus first input
      const input = searchBar.querySelector('input[type="search"]');
      if (input) setTimeout(() => input.focus(), 150);
    }
  });
}

// ===== Mobile menu =====
const menuToggle = document.getElementById('menuToggle');
const menuClose = document.getElementById('menuClose');
const mobileMenu = document.getElementById('mobileMenu');

function closeMenu(){
  mobileMenu.classList.remove('show');
  mobileMenu.setAttribute('aria-hidden', 'true');
  setBodyScrollLocked(false);
  if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
}
function openMenu(){
  mobileMenu.classList.add('show');
  mobileMenu.setAttribute('aria-hidden', 'false');
  setBodyScrollLocked(true);
  if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
}

if (menuToggle && mobileMenu){
  menuToggle.addEventListener('click', openMenu);
}
if (menuClose){
  menuClose.addEventListener('click', closeMenu);
}
mobileMenu?.addEventListener('click', (e) => {
  // close if background clicked
  if (e.target === mobileMenu) closeMenu();
});

// Close menu on link click
document.querySelectorAll('#mobileMenu a.mobile-link').forEach(a => {
  a.addEventListener('click', closeMenu);
});

// ===== Year in footer =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== Insights category filter (client-side) =====
const tabs = document.querySelectorAll('.insights-tabs .nav-link');
const cards = document.querySelectorAll('#insightsGrid > div[data-category]');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const cat = tab.getAttribute('data-category');
    cards.forEach(card => {
      const c = card.getAttribute('data-category');
      card.classList.toggle('d-none', !(cat === 'all' || c === cat));
    });
  });
});

// ===== Experts form stepper =====
const expertsForm = document.getElementById('expertsForm');
const expertsNext = document.getElementById('expertsNext');
const step2 = document.getElementById('expertsStep2');
const expertsBack = document.getElementById('expertsBack');
const expertsSubmit = document.getElementById('expertsSubmit');
const expertsThanks = document.getElementById('expertsThanks');

function validateStep1(){
  if (!expertsForm) return false;
  let valid = true;
  expertsForm.querySelectorAll('input[required]').forEach(inp => {
    if (!inp.value.trim()){
      inp.classList.add('is-invalid');
      valid = false;
    } else {
      inp.classList.remove('is-invalid');
    }
  });
  // rudimentary email check
  const email = expertsForm.querySelector('#email');
  if (email && !/^\S+@\S+\.\S+$/.test(email.value)){
    email.classList.add('is-invalid');
    valid = false;
  }
  return valid;
}

expertsNext?.addEventListener('click', () => {
  if (!validateStep1()) return;
  expertsForm.classList.add('d-none');
  step2.classList.remove('d-none');
});

expertsBack?.addEventListener('click', () => {
  step2.classList.add('d-none');
  expertsForm.classList.remove('d-none');
});

expertsSubmit?.addEventListener('click', () => {
  step2.classList.add('d-none');
  expertsThanks.classList.remove('d-none');
  // Here you’d POST the data to your backend
});
