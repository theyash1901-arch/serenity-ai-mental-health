// ── STATE ──
let currentUser = null, currentSessionId = null, isLoading = false, chatStarted = false;
let currentFilter = 'all', selectedMood = null, selectedMoodScore = 3, selectedEmotions = [];
let checkinMood = null, checkinMoodScore = 3;
let breathingActive = false, breathInterval = null, breathPhaseIndex = 0, breathCount = 0;
let affirmationIndex = 0;

// ── AFFIRMATIONS ──
const AFFIRMATIONS = [
  "You are doing better than you think.",
  "Every small step forward counts.",
  "It is okay to not be okay sometimes.",
  "You deserve kindness — especially from yourself.",
  "Your feelings are valid, always.",
  "Progress, not perfection.",
  "You have made it through every difficult day so far.",
  "Rest is productive. You are allowed to pause.",
  "Healing is not linear, and that is okay.",
  "You are enough, exactly as you are today."
];

function cycleAffirmation() {
  affirmationIndex = (affirmationIndex + 1) % AFFIRMATIONS.length;
  const el = document.getElementById('affirmation-text');
  el.style.opacity = '0';
  setTimeout(() => { el.textContent = AFFIRMATIONS[affirmationIndex]; el.style.opacity = '1'; }, 350);
}

// ── AMBIENT CANVAS ──
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const particles = Array.from({length: 16}, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: Math.random() * 90 + 40,
    dx: (Math.random() - .5) * .25, dy: (Math.random() - .5) * .25,
    color: ['rgba(168,213,186,','rgba(168,196,232,','rgba(197,184,232,'][Math.floor(Math.random()*3)]
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, p.color + '0.1)'); g.addColorStop(1, p.color + '0)');
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = g; ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < -p.r) p.x = canvas.width + p.r;
      if (p.x > canvas.width + p.r) p.x = -p.r;
      if (p.y < -p.r) p.y = canvas.height + p.r;
      if (p.y > canvas.height + p.r) p.y = -p.r;
    });
    requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
}

// ── BREATHING ──
const BREATH_PHASES = [
  { label: 'Inhale', duration: 4, instruction: 'Breathe in slowly...', scale: 1.32 },
  { label: 'Hold',   duration: 7, instruction: 'Hold your breath...', scale: 1.32 },
  { label: 'Exhale', duration: 8, instruction: 'Breathe out slowly...', scale: 1.0 }
];

function toggleBreathing() { breathingActive ? stopBreathing() : startBreathing(); }

function startBreathing() {
  breathingActive = true; breathPhaseIndex = 0; breathCount = 0;
  document.getElementById('breath-btn').textContent = 'Stop';
  document.getElementById('breath-timer').style.display = 'block';
  runBreathPhase();
}

function stopBreathing() {
  breathingActive = false; clearInterval(breathInterval);
  const orb = document.getElementById('breath-orb');
  orb.style.transform = ''; orb.style.transition = '';
  document.getElementById('breath-label').textContent = '4-7-8 Breathing';
  document.getElementById('breath-phase').textContent = 'Tap to begin';
  document.getElementById('breath-timer').style.display = 'none';
  document.getElementById('breath-btn').textContent = 'Start Exercise';
}

function runBreathPhase() {
  if (!breathingActive) return;
  const phase = BREATH_PHASES[breathPhaseIndex];
  const orb = document.getElementById('breath-orb');
  document.getElementById('breath-label').textContent = phase.label;
  document.getElementById('breath-phase').textContent = phase.instruction;
  orb.style.transition = `transform ${phase.duration}s ease-in-out`;
  orb.style.transform = `scale(${phase.scale})`;
  let remaining = phase.duration;
  document.getElementById('breath-timer').textContent = remaining;
  const tick = setInterval(() => {
    remaining--;
    const el = document.getElementById('breath-timer');
    if (el) el.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(tick);
      if (!breathingActive) return;
      breathPhaseIndex = (breathPhaseIndex + 1) % BREATH_PHASES.length;
      if (breathPhaseIndex === 0) {
        breathCount++;
        if (breathCount >= 3) { stopBreathing(); showToast('3 cycles complete. Well done.'); return; }
      }
      runBreathPhase();
    }
  }, 1000);
  breathInterval = tick;
}

// ── RESOURCES DATA ──
const RESOURCES = [
  { cat:'article',  badge:'Article',  title:'Understanding Anxiety Disorders',    desc:'A comprehensive guide to recognizing and managing anxiety in everyday life.',                          time:'8 min read',
    icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  { cat:'exercise', badge:'Exercise', title:'5-Minute Body Scan Meditation',       desc:'A calming guided meditation to release tension and reconnect with your body.',                        time:'5 min',
    icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>' },
  { cat:'guide',    badge:'Guide',    title:'The Complete Sleep Hygiene Guide',    desc:'Evidence-based strategies to improve sleep quality and reduce nighttime anxiety.',                     time:'12 min read',
    icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' },
  { cat:'tool',     badge:'Tool',     title:'CBT Thought Record Worksheet',        desc:'A structured worksheet for challenging and reframing negative thought patterns.',                      time:'Interactive',
    icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' },
  { cat:'exercise', badge:'Exercise', title:'4-7-8 Breathing Technique',           desc:'A proven breathing pattern to activate your parasympathetic nervous system instantly.',              time:'3 min',
    icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>' },
  { cat:'article',  badge:'Article',  title:'Building Emotional Resilience',       desc:'Practical skills to help you bounce back from life\'s challenges with greater strength.',            time:'10 min read',
    icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  { cat:'guide',    badge:'Guide',    title:'Mindfulness for Beginners',           desc:'An accessible introduction to mindfulness practices that fit into daily life.',                       time:'15 min',
    icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>' },
  { cat:'tool',     badge:'Tool',     title:'Panic Attack First Aid',              desc:'What to do in the moment when anxiety peaks — quick, actionable strategies.',                        time:'5 min read',
    icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
  { cat:'exercise', badge:'Exercise', title:'Gratitude Journaling Practice',       desc:'A daily gratitude framework that rewires your brain toward positive emotional patterns.',             time:'Daily 5 min',
    icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' }
];

// ── MOOD CHECK-IN POPUP ──
function showCheckinPopup() {
  const popup = document.getElementById('mood-checkin-popup');
  if (!popup || sessionStorage.getItem('checkin_shown')) return;
  sessionStorage.setItem('checkin_shown', '1');
  setTimeout(() => popup.classList.add('show'), 2800);
}
function dismissCheckin() { document.getElementById('mood-checkin-popup').classList.remove('show'); }
function selectCheckinMood(btn, mood, score) {
  checkinMood = mood; checkinMoodScore = score;
  document.querySelectorAll('.mcp-mood-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}
async function submitCheckin() {
  if (!checkinMood) { showToast('Please select a mood first.'); return; }
  if (!currentUser) { dismissCheckin(); openModal(); return; }
  try {
    await fetch('/api/mood', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({mood: checkinMood, mood_score: checkinMoodScore, note:'', emotions:[]}) });
    dismissCheckin();
    showToast('Mood logged. Keep it up.');
    updateStreak();
  } catch(e) { console.error(e); }
}

// ── STREAK ──
async function updateStreak() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/mood');
    const data = await res.json();
    const entries = data.entries || [];
    let streak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 0; i < 30; i++) {
      const day = new Date(today); day.setDate(today.getDate() - i);
      const found = entries.some(e => { const d = new Date(e.logged_at); d.setHours(0,0,0,0); return d.getTime() === day.getTime(); });
      if (found) streak++; else break;
    }
    const el = document.getElementById('streak-count');
    if (el) el.textContent = `${streak} day streak`;
  } catch(e) {}
}

// ── DOM LOAD ──
document.addEventListener('DOMContentLoaded', async () => {
  initAmbientCanvas();
  showCheckinPopup();
  setInterval(cycleAffirmation, 9000);
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      currentUser = data; updateNav(); loadUserSessions(); updateStreak();
    }
  } catch(e) { console.error(e); }
  const dateEl = document.getElementById('sidebar-date');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});
});

// ── NAVIGATION ──
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const link = Array.from(document.querySelectorAll('.nav-link')).find(l => l.getAttribute('onclick') && l.getAttribute('onclick').includes(id));
  if (link) link.classList.add('active');
  window.scrollTo(0,0);
  if (id === 'chat-page') {
    if (currentUser && !currentSessionId) createNewSession().then(() => { initChat(); loadWeeklyMiniChart(); });
    else if (currentUser) loadWeeklyMiniChart();
  } else if (id === 'mood-page') loadMoodData();
  else if (id === 'resources-page') renderResources();
}

window.addEventListener('scroll', () => {
  const nav = document.getElementById('topnav');
  if (window.scrollY > 20) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
});

// ── MODAL ──
function openModal() { document.getElementById('modal-overlay').classList.add('open'); }
function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
function handleOverlayClick(e) { if (e.target.id === 'modal-overlay') closeModal(); }

function switchModalTab(mode) {
  document.querySelectorAll('.mtab').forEach(b => b.classList.remove('active'));
  document.getElementById(`mtab-${mode}`).classList.add('active');
  const email = document.getElementById('modal-email');
  const pwd = document.getElementById('modal-password');
  const conf = document.getElementById('modal-confirm');
  const anonBtn = document.getElementById('modal-anon-btn');
  const submitBtn = document.getElementById('modal-submit');
  const divi = document.getElementById('modal-divider');
  const err = document.getElementById('modal-error');
  err.style.display = 'none';
  if (mode === 'login') {
    email.style.display='block'; pwd.style.display='block'; conf.style.display='none';
    anonBtn.style.display='block'; divi.style.display='flex'; submitBtn.textContent='Sign In';
  } else if (mode === 'signup') {
    email.style.display='block'; pwd.style.display='block'; conf.style.display='block';
    anonBtn.style.display='block'; divi.style.display='flex'; submitBtn.textContent='Create Account';
  } else if (mode === 'anon') {
    email.style.display='none'; pwd.style.display='none'; conf.style.display='none';
    anonBtn.style.display='none'; divi.style.display='none'; submitBtn.textContent='Continue Anonymously';
  }
}

function updateNav() {
  const nameEl = document.getElementById('nav-username');
  const startBtn = document.getElementById('nav-btn-start');
  const logoutBtn = document.getElementById('nav-btn-logout');
  if (currentUser) {
    nameEl.textContent = `Welcome, ${currentUser.username}`; nameEl.style.display='inline';
    startBtn.style.display='none'; logoutBtn.style.display='inline-flex';
  } else {
    nameEl.style.display='none'; startBtn.style.display='inline-flex'; logoutBtn.style.display='none';
  }
}

// ── AUTH ──
function getModalTab() {
  const active = document.querySelector('.mtab.active');
  return active ? active.id.replace('mtab-','') : 'login';
}

async function handleModalSubmit() {
  const tab = getModalTab();
  if (tab === 'anon') { handleAnonymous(); return; }
  const email = document.getElementById('modal-email').value.trim();
  const pwd   = document.getElementById('modal-password').value;
  const conf  = document.getElementById('modal-confirm').value;
  const err   = document.getElementById('modal-error');
  err.style.display = 'none';
  if (!email || !pwd) { err.textContent = 'Please fill in all fields.'; err.style.display='block'; return; }
  if (tab === 'signup') {
    if (pwd.length < 6) { err.textContent = 'Password must be at least 6 characters.'; err.style.display='block'; return; }
    if (pwd !== conf)   { err.textContent = 'Passwords do not match.'; err.style.display='block'; return; }
    await handleSignup(email, pwd, err);
  } else {
    await handleLogin(email, pwd, err);
  }
}

async function handleSignup(email, pwd, err) {
  try {
    const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email, password: pwd, username: email.split('@')[0]}) });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error || 'Registration failed.'; err.style.display='block'; return; }
    currentUser = data; closeModal(); updateNav(); createNewSession(); showToast('Welcome to Serenity.');
  } catch(e) { err.textContent = 'Something went wrong. Please try again.'; err.style.display='block'; }
}

async function handleLogin(email, pwd, err) {
  try {
    const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email, password: pwd}) });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error || 'Login failed.'; err.style.display='block'; return; }
    currentUser = data; closeModal(); updateNav(); loadUserSessions(); updateStreak(); showToast('Welcome back.');
  } catch(e) { err.textContent = 'Something went wrong. Please try again.'; err.style.display='block'; }
}

async function handleAnonymous() {
  try {
    const res = await fetch('/api/auth/anonymous', { method:'POST' });
    const data = await res.json();
    if (!res.ok) return;
    currentUser = data; closeModal(); updateNav(); createNewSession(); showToast('Continuing anonymously.');
  } catch(e) { console.error(e); }
}

async function logout() {
  try { await fetch('/api/auth/logout', { method:'POST' }); } catch(e) {}
  currentUser = null; currentSessionId = null; chatStarted = false;
  updateNav();
  document.getElementById('session-list').innerHTML = '';
  document.getElementById('chat-messages').innerHTML = '';
  showPage('landing');
}

// ── SESSIONS ──
async function createNewSession() {
  if (!currentUser) { openModal(); return; }
  try {
    const res = await fetch('/api/sessions', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({title:'New Conversation'}) });
    const data = await res.json();
    currentSessionId = data._id || data.id;
    chatStarted = false;
    document.getElementById('chat-messages').innerHTML = '';
    initChat();
    loadUserSessions();
  } catch(e) { console.error(e); }
}

async function loadUserSessions() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/sessions');
    const data = await res.json();
    const list = document.getElementById('session-list');
    list.innerHTML = '';
    (data.sessions || []).slice(0,12).forEach(s => {
      const div = document.createElement('div');
      div.className = 'session-item' + (s._id === currentSessionId || s.id === currentSessionId ? ' active' : '');
      div.innerHTML = `<div class="s-title">${sanitize(s.title || 'Conversation')}</div><div class="s-date">${formatDate(s.created_at)}</div>`;
      div.onclick = () => loadSession(s._id || s.id);
      list.appendChild(div);
    });
  } catch(e) { console.error(e); }
}

async function loadSession(id) {
  currentSessionId = id; chatStarted = true;
  document.getElementById('chat-messages').innerHTML = '';
  document.querySelectorAll('.session-item').forEach(el => el.classList.remove('active'));
  try {
    const res = await fetch(`/api/sessions/${id}/messages`);
    const data = await res.json();
    (data.messages || []).forEach(m => {
      if (m.role === 'user') appendUser(m.content, extractTime(m.created_at));
      else appendAI(m.content, extractTime(m.created_at));
    });
    loadUserSessions();
  } catch(e) { console.error(e); }
}

// ── CHAT ──
function initChat() {
  const msgs = document.getElementById('chat-messages');
  if (chatStarted || msgs.children.length > 0) return;
  chatStarted = true;
  appendAITyped("Hello. I'm Serenity. This is your safe space — no judgment, just support. How are you feeling today?");
}

function handleEnter(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendClick(); }
}

function handleSendClick() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || isLoading) return;
  input.value = ''; autoResize(input);
  sendMessage(text);
}

async function sendMessage(text) {
  if (!currentUser) { openModal(); return; }
  if (!currentSessionId) { await createNewSession(); }
  appendUser(text, now());
  showTyping();
  isLoading = true;
  document.getElementById('send-btn').classList.add('sending');
  try {
    const res = await fetch(`/api/sessions/${currentSessionId}/messages`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({message: text})
    });
    const data = await res.json();
    hideTyping();
    appendAITyped(data.response || data.message || 'I am here with you.');
    loadUserSessions();
  } catch(e) {
    hideTyping();
    appendAI('I am here. Something went wrong on my end — please try again.');
  } finally {
    isLoading = false;
    document.getElementById('send-btn').classList.remove('sending');
  }
}

function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str; return d.innerHTML;
}

function formatText(str) {
  return sanitize(str)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function extractTime(ts) {
  if (!ts) return now();
  const d = new Date(ts);
  return isNaN(d) ? now() : d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
}

function appendAITyped(text) {
  const msgs = document.getElementById('chat-messages');
  const wrap = document.createElement('div');
  wrap.className = 'cmsg ai';
  wrap.innerHTML = `
    <div class="c-avatar ai">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
    </div>
    <div class="cmsg-body">
      <div class="cmsg-bubble">
        <span class="typed-text"></span>
        <div class="msg-reaction-bar">
          <button onclick="reactMsg(this,'Helpful')">Helpful</button>
          <button onclick="reactMsg(this,'Comforting')">Comforting</button>
          <button onclick="reactMsg(this,'Thank you')">Thank you</button>
          <button onclick="reactMsg(this,'Insightful')">Insightful</button>
        </div>
      </div>
      <div class="cmsg-time">${now()}</div>
    </div>`;
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
  const span = wrap.querySelector('.typed-text');
  let i = 0;
  const interval = setInterval(() => {
    span.innerHTML = formatText(text.slice(0, i));
    i++;
    msgs.scrollTop = msgs.scrollHeight;
    if (i > text.length) clearInterval(interval);
  }, 18);
}

function appendAI(text, time) {
  const msgs = document.getElementById('chat-messages');
  const wrap = document.createElement('div');
  wrap.className = 'cmsg ai';
  wrap.innerHTML = `
    <div class="c-avatar ai">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
    </div>
    <div class="cmsg-body">
      <div class="cmsg-bubble">
        ${formatText(text)}
        <div class="msg-reaction-bar">
          <button onclick="reactMsg(this,'Helpful')">Helpful</button>
          <button onclick="reactMsg(this,'Comforting')">Comforting</button>
          <button onclick="reactMsg(this,'Thank you')">Thank you</button>
          <button onclick="reactMsg(this,'Insightful')">Insightful</button>
        </div>
      </div>
      <div class="cmsg-time">${time || now()}</div>
    </div>`;
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}

function appendUser(text, time) {
  const msgs = document.getElementById('chat-messages');
  const initials = currentUser ? (currentUser.username || 'U').slice(0,1).toUpperCase() : 'U';
  const wrap = document.createElement('div');
  wrap.className = 'cmsg user';
  wrap.innerHTML = `
    <div class="cmsg-body">
      <div class="cmsg-bubble">${formatText(text)}</div>
      <div class="cmsg-time">${time || now()}</div>
    </div>
    <div class="c-avatar u">${initials}</div>`;
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}

function reactMsg(btn, label) {
  btn.style.background = 'var(--cream)';
  btn.style.color = 'var(--deep-sage)';
  btn.style.fontWeight = '600';
  showToast(`Marked as: ${label}`);
}

function showTyping() {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'cmsg ai'; div.id = 'typing-indicator';
  div.innerHTML = `
    <div class="c-avatar ai">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
    </div>
    <div class="typing-indicator"><span></span><span></span><span></span></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 130) + 'px';
}

// ── MOOD SIDEBAR ──
async function setMiniMood(btn) {
  const mood = btn.dataset.mood;
  document.querySelectorAll('.mood-mini-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  if (!currentUser) return;
  const scoreMap = {Happy:5, Calm:4, Sad:2, Anxious:2, Angry:1};
  try {
    await fetch('/api/mood', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({mood, mood_score: scoreMap[mood] || 3, note:'', emotions:[]}) });
    updateStreak();
  } catch(e) { console.error(e); }
}

// ── MOOD PAGE ──
async function loadMoodData() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/mood');
    const data = await res.json();
    const entries = data.entries || [];
    buildBigChart(entries);
    updateMoodStats(entries);
    renderRecentEntries(entries);
    buildEmoChips();
  } catch(e) { console.error(e); }
}

function loadWeeklyMiniChart() {
  if (!currentUser) return;
  fetch('/api/mood').then(r => r.json()).then(data => {
    buildMiniChart(data.entries || []);
  }).catch(() => {});
}

function getMoodColor(mood) {
  const map = {Happy:'var(--mood-happy)', Calm:'var(--mood-calm)', Sad:'var(--mood-sad)', Anxious:'var(--mood-anxious)', Angry:'var(--mood-angry)'};
  return map[mood] || 'var(--sage)';
}

function getMoodLabel(mood) {
  return mood || '--';
}

function buildBigChart(entries) {
  const container = document.getElementById('big-bar-chart');
  if (!container) return;
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = new Date(); today.setHours(0,0,0,0);
  const cols = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const dayEntries = entries.filter(e => {
      const ed = new Date(e.logged_at); ed.setHours(0,0,0,0);
      return ed.getTime() === d.getTime();
    });
    const score = dayEntries.length ? Math.round(dayEntries.reduce((a,e) => a + (e.mood_score||3), 0) / dayEntries.length) : 0;
    const mood = dayEntries.length ? dayEntries[dayEntries.length-1].mood : null;
    cols.push({day: days[d.getDay()], score, mood, hasData: dayEntries.length > 0});
  }
  container.innerHTML = cols.map(c => `
    <div class="bar-col">
      <div class="bar-val" style="color:${c.hasData ? getMoodColor(c.mood) : 'var(--warm-gray)'}">${c.hasData ? c.score : ''}</div>
      <div class="bar-div" style="height:${c.hasData ? (c.score/5)*100 : 8}%;background:${c.hasData ? getMoodColor(c.mood) : 'rgba(168,213,186,.2)'}"></div>
      <div class="bar-day">${c.day}</div>
    </div>`).join('');
}

function buildMiniChart(entries) {
  const container = document.getElementById('right-mini-bars');
  if (!container) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const cols = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const dayEntries = entries.filter(e => {
      const ed = new Date(e.logged_at); ed.setHours(0,0,0,0);
      return ed.getTime() === d.getTime();
    });
    const score = dayEntries.length ? Math.round(dayEntries.reduce((a,e) => a + (e.mood_score||3), 0) / dayEntries.length) : 0;
    const mood = dayEntries.length ? dayEntries[dayEntries.length-1].mood : null;
    cols.push({score, mood, hasData: dayEntries.length > 0});
  }
  container.innerHTML = cols.map(c => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%">
      <div style="width:100%;border-radius:4px;background:${c.hasData ? getMoodColor(c.mood) : 'rgba(168,213,186,.2)'};height:${c.hasData ? (c.score/5)*100 : 8}%;min-height:4px;transition:height .5s"></div>
    </div>`).join('');
}

function updateMoodStats(entries) {
  const today = new Date(); today.setHours(0,0,0,0);
  const weekEntries = entries.filter(e => {
    const d = new Date(e.logged_at); d.setHours(0,0,0,0);
    return (today - d) / 86400000 < 7;
  });
  const avg = weekEntries.length ? (weekEntries.reduce((a,e) => a + (e.mood_score||3), 0) / weekEntries.length).toFixed(1) : '--';
  const days = new Set(weekEntries.map(e => { const d = new Date(e.logged_at); d.setHours(0,0,0,0); return d.getTime(); })).size;
  const moodCounts = {};
  weekEntries.forEach(e => { moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });
  const topMood = Object.keys(moodCounts).sort((a,b) => moodCounts[b]-moodCounts[a])[0] || '--';
  const avgEl = document.getElementById('stat-avg'); if (avgEl) avgEl.textContent = avg;
  const daysEl = document.getElementById('stat-days'); if (daysEl) daysEl.textContent = days;
  const moodEl = document.getElementById('stat-mood'); if (moodEl) moodEl.textContent = topMood;
}

function renderRecentEntries(entries) {
  const container = document.getElementById('recent-entries');
  if (!container) return;
  if (!entries.length) { container.innerHTML = '<div class="empty-msg">No entries yet. Log your first mood above.</div>'; return; }
  container.innerHTML = entries.slice(0,8).map(e => `
    <div class="ml-r-item">
      <div class="ml-r-dot" style="background:${getMoodColor(e.mood)}"></div>
      <div class="ml-r-info">
        <div class="ml-r-top">
          <span class="ml-r-badge" style="background:${getMoodColor(e.mood)}22;color:${getMoodColor(e.mood)}">${getMoodLabel(e.mood)}</span>
          <span class="ml-r-date">${formatDate(e.logged_at)}</span>
        </div>
        ${e.note ? `<div class="ml-r-note">${sanitize(e.note)}</div>` : ''}
      </div>
    </div>`).join('');
}

function buildEmoChips() {
  const container = document.getElementById('emo-chips');
  if (!container) return;
  const chips = ["Joyful","Peaceful","Down","Worried","Frustrated","Confused","Grateful","Tired","Irritable","Connected"];
  container.innerHTML = chips.map(c => `<div class="emo-chip" onclick="toggleEmoChip(this,'${c}')">${c}</div>`).join('');
}

function toggleEmoChip(el, label) {
  el.classList.toggle('sel');
  if (el.classList.contains('sel')) selectedEmotions.push(label);
  else selectedEmotions = selectedEmotions.filter(e => e !== label);
}

function selectMood(mood, score, btn) {
  selectedMood = mood; selectedMoodScore = score;
  document.querySelectorAll('.ml-ms-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}

async function saveMoodEntry() {
  if (!selectedMood) { showToast('Please select a mood first.'); return; }
  if (!currentUser) { openModal(); return; }
  const note = document.getElementById('mood-journal').value.trim();
  try {
    await fetch('/api/mood', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({mood: selectedMood, mood_score: selectedMoodScore, note, emotions: selectedEmotions}) });
    showToast('Mood entry saved.');
    document.getElementById('mood-journal').value = '';
    selectedMood = null; selectedMoodScore = 3; selectedEmotions = [];
    document.querySelectorAll('.ml-ms-btn').forEach(b => b.classList.remove('sel'));
    document.querySelectorAll('.emo-chip').forEach(b => b.classList.remove('sel'));
    loadMoodData(); updateStreak();
  } catch(e) { showToast('Could not save entry. Please try again.'); }
}

// ── RESOURCES ──
function filterRes(btn, cat) {
  currentFilter = cat;
  document.querySelectorAll('.rf-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderResources();
}

function renderResources() {
  const grid = document.getElementById('res-grid');
  if (!grid) return;
  const filtered = currentFilter === 'all' ? RESOURCES : RESOURCES.filter(r => r.cat === currentFilter);
  grid.innerHTML = filtered.map(r => `
    <div class="res-card cat-${r.cat}">
      <div class="rc-header">
        <div class="rc-icon">${r.icon}</div>
        <div class="rc-badge">${r.badge}</div>
      </div>
      <h3>${sanitize(r.title)}</h3>
      <p>${sanitize(r.desc)}</p>
      <div class="rc-footer">
        <span class="rc-time">${sanitize(r.time)}</span>
        <span class="rc-link">Read more &rarr;</span>
      </div>
    </div>`).join('');
}

// ── UTILS ──
function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}

function now() {
  return new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
}

function showToast(msg) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .4s'; setTimeout(() => toast.remove(), 400); }, 3000);
}
