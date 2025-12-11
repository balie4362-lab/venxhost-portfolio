/* venxhosts.js
   All interactive logic:
   - Particle canvas
   - Admin login (localStorage-based)
   - Links management (add/delete/reset)
   - Render dynamic link cards
   - Modal behavior and UI controls
*/

/* =========================
   Constants & Defaults
   ========================= */
const STORAGE_KEY = 'venx_links_v1';
const ADMIN_FLAG = 'venx_admin_auth';
const DEFAULT_LINKS = [
  { title: "Panel", url: "https://panel.venxhosts.me" }
];

/* =========================
   Helper: DOM shortcuts
   ========================= */
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

/* =========================
   Link storage & rendering
   ========================= */
function loadLinks(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) { localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LINKS)); return DEFAULT_LINKS.slice(); }
    return JSON.parse(raw);
  } catch(e){
    console.error('Error loading links', e);
    return DEFAULT_LINKS.slice();
  }
}
function saveLinks(links){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}
function resetToDefault(){
  saveLinks(DEFAULT_LINKS.slice());
  renderLinks();
  renderAdminLinks();
}

/* Render link cards for users */
function renderLinks(){
  const container = $('#linksGrid');
  container.innerHTML = '';
  const links = loadLinks();
  links.forEach((lnk, idx) => {
    const card = document.createElement('div');
    card.className = 'link-card';
    card.setAttribute('role','listitem');

    const a = document.createElement('a');
    a.href = lnk.url;
    a.textContent = lnk.title;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', `${lnk.title} link`);

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    // If admin is logged in show inline delete
    if(isAdmin()){
      const del = document.createElement('button');
      del.className = 'btn btn--ghost';
      del.textContent = 'Delete';
      del.title = 'Delete link';
      del.addEventListener('click', (e) => {
        e.preventDefault();
        deleteLink(idx);
      });
      actions.appendChild(del);
    } else {
      const open = document.createElement('a');
      open.className = 'btn btn--ghost';
      open.href = lnk.url;
      open.textContent = 'Open';
      open.target = '_blank';
      open.rel = 'noopener noreferrer';
      actions.appendChild(open);
    }

    card.appendChild(a);
    card.appendChild(actions);
    container.appendChild(card);
  });

  // If empty, show helpful hint
  if(links.length === 0){
    const hint = document.createElement('div');
    hint.className = 'link-card';
    hint.textContent = 'No saved links. Admins can add links via the Admin panel.';
    container.appendChild(hint);
  }
}

/* =========================
   Admin actions
   ========================= */
function isAdmin(){
  return sessionStorage.getItem(ADMIN_FLAG) === 'true';
}
function setAdmin(flag){
  if(flag) sessionStorage.setItem(ADMIN_FLAG,'true');
  else sessionStorage.removeItem(ADMIN_FLAG);
}

/* Delete by index */
function deleteLink(index){
  const links = loadLinks();
  links.splice(index,1);
  saveLinks(links);
  renderLinks();
  renderAdminLinks();
}

/* Add link */
function addLink(title, url){
  const links = loadLinks();
  links.push({ title, url });
  saveLinks(links);
  renderLinks();
  renderAdminLinks();
}

/* =========================
   Admin Modal & UI wiring
   ========================= */
const adminBtn = $('#adminBtn');
const adminModal = $('#adminModal');
const modalClose = $('#modalClose');
const loginForm = $('#loginForm');
const demoCreds = $('#demoCreds');
const manager = $('#manager');
const addLinkForm = $('#addLinkForm');
const adminLinksList = $('#adminLinksList');
const resetLinksBtn = $('#resetLinks');
const logoutBtn = $('#logoutBtn');

function openModal(){
  adminModal.setAttribute('aria-hidden','false');
  adminModal.style.display = 'grid';
  setTimeout(()=> adminModal.focus(), 150);
  renderModalState();
}
function closeModal(){
  adminModal.setAttribute('aria-hidden','true');
  adminModal.style.display = 'none';
}

/* Render modal based on auth */
function renderModalState(){
  if(isAdmin()){
    $('#loginForm').hidden = true;
    manager.hidden = false;
    renderAdminLinks();
  } else {
    $('#loginForm').hidden = false;
    manager.hidden = true;
  }
}

/* Render admin-managed link list */
function renderAdminLinks(){
  adminLinksList.innerHTML = '';
  const links = loadLinks();
  if(links.length === 0){
    const p = document.createElement('div');
    p.className = 'muted';
    p.textContent = 'No links saved.';
    adminLinksList.appendChild(p);
    return;
  }
  links.forEach((lnk, idx) => {
    const item = document.createElement('div');
    item.className = 'admin-link-item';

    const meta = document.createElement('div');
    meta.innerHTML = `<div class="meta"><strong>${escapeHtml(lnk.title)}</strong> <span style="color:var(--muted)">—</span> <small>${escapeHtml(lnk.url)}</small></div>`;

    const controls = document.createElement('div');
    controls.style.display='flex'; controls.style.gap='0.5rem';
    const open = document.createElement('a');
    open.className = 'btn btn--ghost';
    open.textContent = 'Open';
    open.href = lnk.url;
    open.target = '_blank';
    open.rel = 'noopener noreferrer';

    const del = document.createElement('button');
    del.className = 'btn btn--danger';
    del.textContent = 'Delete';
    del.addEventListener('click', ()=> {
      if(confirm(`Delete link "${lnk.title}"?`)){
        deleteLink(idx);
      }
    });

    controls.appendChild(open);
    controls.appendChild(del);

    item.appendChild(meta);
    item.appendChild(controls);
    adminLinksList.appendChild(item);
  });
}

/* Utility: basic escape to avoid injection when injecting text */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }

/* =========================
   Login handling
   ========================= */
loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = $('#adminUsername').value.trim();
  const pass = $('#adminPassword').value;
  // Simple front-end auth
  if(user === 'admin' && pass === 'Venx@123'){
    setAdmin(true);
    renderModalState();
    renderLinks(); // show delete buttons
    alert('Admin logged in');
  } else {
    alert('Invalid credentials');
  }
});

demoCreds?.addEventListener('click', () => {
  $('#adminUsername').value = 'admin';
  $('#adminPassword').value = 'Venx@123';
});

/* Add link form */
addLinkForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = $('#linkTitle').value.trim();
  const url = $('#linkURL').value.trim();
  if(!title || !url){
    alert('Please fill both fields');
    return;
  }
  addLink(title, url);
  $('#linkTitle').value = '';
  $('#linkURL').value = '';
});

/* Reset links */
resetLinksBtn?.addEventListener('click', () => {
  if(confirm('Reset links to default?')) resetToDefault();
});

/* Logout */
logoutBtn?.addEventListener('click', () => {
  setAdmin(false);
  renderModalState();
  renderLinks();
});

/* Modal open/close wiring */
adminBtn?.addEventListener('click', openModal);
modalClose?.addEventListener('click', closeModal);
adminModal?.addEventListener('click', (e) => {
  if(e.target === adminModal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape') closeModal();
});

/* =========================
   Setup initial UI
   ========================= */
document.addEventListener('DOMContentLoaded', () => {
  // Ensure defaults exist
  if(!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LINKS));
  renderLinks();
  // Ensure modal hidden initially
  adminModal.style.display = 'none';
  // Render admin state if already authenticated
  renderModalState();

  // small accessibility: ensure hero is first focusable element
  $('#heroCard').setAttribute('tabindex','-1');

  // Particle system init
  particleInit();
});

/* =========================
   Admin Helpers: public reset (optional)
   ========================= */
window.venx_resetToDefaults = resetToDefault;

/* =========================
   Particle Canvas System
   ========================= */
function particleInit(){
  const canvas = document.getElementById('particleCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const particles = [];
  const PARTICLE_COUNT = Math.round((w*h) / 45000); // scale with viewport

  function rand(min,max){ return Math.random()*(max-min)+min; }

  // Particle prototype
  class Particle{
    constructor(){
      this.reset();
    }
    reset(){
      this.x = rand(0,w);
      this.y = rand(0,h);
      this.vx = rand(-0.2,0.6);
      this.vy = rand(-0.15,0.35);
      this.size = rand(0.6,2.5);
      this.alpha = rand(0.05,0.22);
      this.color = Math.random() > 0.5 ? 'rgba(124,92,255,'+this.alpha+')' : 'rgba(0,230,216,'+this.alpha+')';
      this.life = rand(80, 260);
      this.age = 0;
    }
    step(){
      this.x += this.vx;
      this.y += this.vy;
      this.age++;
      if(this.x > w + 40 || this.x < -40 || this.y > h + 40 || this.y < -40 || this.age > this.life) this.reset();
    }
    draw(ctx){
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size*10);
      g.addColorStop(0, this.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.fillStyle = g;
      ctx.arc(this.x, this.y, this.size*6, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // populate
  for(let i=0;i<PARTICLE_COUNT;i++) particles.push(new Particle());

  // resize handler
  function onResize(){
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    // Recompute number of particles
    const desired = Math.round((w*h) / 45000);
    while(particles.length < desired) particles.push(new Particle());
    while(particles.length > desired) particles.pop();
  }
  window.addEventListener('resize', onResize);

  // animation
  let last = performance.now();
  function loop(now){
    const dt = now - last;
    last = now;
    ctx.clearRect(0,0,w,h);

    // subtle background noise
    ctx.globalCompositeOperation = 'lighter';
    for(const p of particles){
      p.step();
      p.draw(ctx);
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* =========================
   Small UX niceties
   ========================= */
/* Clicking anywhere inside the hero card focuses it to allow keyboard scrolling */
$('#heroCard')?.addEventListener('click', () => { $('#heroCard').focus(); });

/* Simple keyboard shortcut: Ctrl+Shift+A opens admin modal */
document.addEventListener('keydown', (e) => {
  if(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a'){ openModal(); }
});
