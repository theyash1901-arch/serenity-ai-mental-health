// ── STATE ──
let currentUser = null;
let currentSessionId = null;
let isLoading = false;
let chatStarted = false;
let currentFilter = 'all';
let selectedMood = null;
let selectedMoodScore = 3;
let selectedEmotions = [];
let checkinMood = null;
let checkinMoodScore = 3;
let breathingActive = false;
let breathInterval = null;
let breathPhaseIndex = 0;
let breathCount = 0;
let affirmationIndex = 0;

// ── AFFIRMATIONS ──
const AFFIRMATIONS = [
  "You are doing better than you think.",
  "Every small step forward counts.",
  "It's okay to not be okay sometimes.",
  "You deserve kindness — especially from yourself.",
  "Your feelings are valid, always.",
  "Progress, not perfection.",
  "You've survived 100% of your hard days so far.",
  "Rest is productive. You are allowed to pause.",
  "Healing isn't linear, and that's okay.",
  "You are enough, exactly as you are today."
];

function cycleAffirmation() {
  affirmationIndex = (affirmationIndex + 1) % AFFIRMATIONS.length;
  const el = document.getElementById('affirmation-text');
  el.style.opacity = '0';
  setTimeout(() => {
    el.textContent = AFFIRMATIONS[affirmationIndex];
    el.style.opacity = '1';
  }, 300);
}

// ── AMBIENT CANVAS ──
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({length: 18}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 80 + 30,
    dx: (Math.random() - 0.5) * 0.3,
    dy: (Math.random() - 0.5) * 0.3,
    color: ['rgba(168,213,186,', 'rgba(168,196,232,', 'rgba(197,184,232,'][Math.floor(Math.random() * 3)]
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, p.color + '0.12)');
      grad.addColorStop(1, p.color + '0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < -p.r) p.x = canvas.width + p.r;
      if (p.x > canvas.width + p.r) p.x = -p.r;
      if (p.y < -p.r) p.y = canvas.height + p.r;
      if (p.y > canvas.height + p.r) p.y = -p.r;
    });
    requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ── BREATHING EXERCISE ──
const BREATH_PHASES = [
  { label: 'Inhale', duration: 4, instruction: 'Breathe in slowly...', scale: 1.35 },
  { label: 'Hold', duration: 7, instruction: 'Hold your breath...', scale: 1.35 },
  { label: 'Exhale', duration: 8, instruction: 'Breathe out slowly...', scale: 1.0 }
];

function toggleBreathing() {
  if (breathingActive) stopBreathing();
  else startBreathing();
}

function startBreathing() {
  breathingActive = true;
  breathPhaseIndex = 0;
  breathCount = 0;
  document.getElementById('breath-btn').textContent = 'Stop';
  document.getElementById('breath-timer').style.display = 'block';
  runBreathPhase();
}

function stopBreathing() {
  breathingActive = false;
  clearTimeout(breathInterval);
  const orb = document.getElementById('breath-orb');
  orb.style.transform = '';
  orb.style.transition = '';
  document.getElementById('breath-label').textContent = '4-7-8 Breathing';
  document.getElementById('breath-phase').textContent = 'Tap to begin';
  document.getElementById('breath-timer').style.display = 'none';
  document.getElementById('breath-btn').textContent = 'Start Exercise';
}

function runBreathPhase() {
  if (!breathingActive) return;
  const phase = BREATH_PHASES[breathPhaseIndex];
  const orb = document.getElementById('breath-orb');
  const labelEl = document.getElementById('breath-label');
  const phaseEl = document.getElementById('breath-phase');
  const timerEl = document.getElementById('breath-timer');

  labelEl.textContent = phase.label;
  phaseEl.textContent = phase.instruction;
  orb.style.transition = `transform ${phase.duration}s ease-in-out`;
  orb.style.transform = `scale(${phase.scale})`;

  let remaining = phase.duration;
  timerEl.textContent = remaining;

  const tick = setInterval(() => {
    remaining--;
    if (timerEl) timerEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(tick);
      if (!breathingActive) return;
      breathPhaseIndex = (breathPhaseIndex + 1) % BREATH_PHASES.length;
      if (breathPhaseIndex === 0) {
        breathCount++;
        if (breathCount >= 3) {
          stopBreathing();
          showToast('🌿 Great job! 3 cycles complete. You should feel calmer now.');
          return;
        }
      }
      runBreathPhase();
    }
  }, 1000);
  breathInterval = tick;
}

// ── RESOURCES DATA ──
const RESOURCES = [
  {emoji:"📖", cat:"article", badge:"Article", badgeColor:"rgba(168,196,232,0.3)", title:"Understanding Anxiety Disorders", desc:"A comprehensive guide to recognizing and managing anxiety in everyday life.", time:"8 min read"},
  {emoji:"🎧", cat:"exercise", badge:"Exercise", badgeColor:"rgba(168,213,186,0.3)", title:"5-Minute Body Scan Meditation", desc:"A calming guided meditation to release tension and reconnect with your body.", time:"5 min"},
  {emoji:"🌙", cat:"guide", badge:"Guide", badgeColor:"rgba(197,184,232,0.3)", title:"The Complete Sleep Hygiene Guide", desc:"Evidence-based strategies to improve sleep quality and reduce nighttime anxiety.", time:"12 min read"},
  {emoji:"✍️", cat:"tool", badge:"Tool", badgeColor:"rgba(240,200,200,0.4)", title:"CBT Thought Record Worksheet", desc:"A structured worksheet for challenging and reframing negative thought patterns.", time:"Interactive"},
  {emoji:"🌬️", cat:"exercise", badge:"Exercise", badgeColor:"rgba(168,213,186,0.3)", title:"4-7-8 Breathing Technique", desc:"A proven breathing pattern to activate your parasympathetic nervous system instantly.", time:"3 min"},
  {emoji:"🌱", cat:"article", badge:"Article", badgeColor:"rgba(168,196,232,0.3)", title:"Building Emotional Resilience", desc:"Practical skills to help you bounce back from life's challenges with greater strength.", time:"10 min read"},
  {emoji:"🧘", cat:"guide", badge:"Guide", badgeColor:"rgba(255,209,102,0.25)", title:"Mindfulness for Beginners", desc:"An accessible introduction to mindfulness practices that fit into daily life.", time:"15 min"},
  {emoji:"🫶", cat:"tool", badge:"Tool", badgeColor:"rgba(240,200,200,0.4)", title:"Panic Attack First Aid", desc:"What to do in the moment when anxiety peaks — quick actionable strategies.", time:"5 min read"},
  {emoji:"📝", cat:"exercise", badge:"Exercise", badgeColor:"rgba(197,184,232,0.3)", title:"Gratitude Journaling Practice", desc:"A daily gratitude framework that rewires your brain toward positive emotional patterns.", time:"Daily 5 min"}
];

// ── MOOD CHECK-IN POPUP ──
function showCheckinPopup() {
  const popup = document.getElementById('mood-checkin-popup');
  if (!popup) return;
  // Only show once per session
  if (sessionStorage.getItem('checkin_shown')) return;
  sessionStorage.setItem('checkin_shown', '1');
  setTimeout(() => popup.classList.add('show'), 2500);
}

function dismissCheckin() {
  document.getElementById('mood-checkin-popup').classList.remove('show');
}

function selectCheckinMood(btn, mood, score) {
  checkinMood = mood;
  checkinMoodScore = score;
  document.querySelectorAll('.mcp-mood-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}

async function submitCheckin() {
  if (!checkinMood) { showToast('Pick a mood first 😊'); return; }
  if (!currentUser) {
    dismissCheckin();
    openModal();
    return;
  }
  try {
    await fetch('/api/mood', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({mood: checkinMood, mood_score: checkinMoodScore, note: '', emotions: []})
    });
    dismissCheckin();
    showToast(`${getMoodEmoji(checkinMood)} Mood logged — keep it up!`);
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
      const found = entries.some(e => {
        const d = new Date(e.logged_at); d.setHours(0,0,0,0);
        return d.getTime() === day.getTime();
      });
      if (found) streak++;
      else break;
    }
    const el = document.getElementById('streak-count');
    if (el) el.textContent = `${streak} day streak`;
  } catch(e) {}
}

// ── DOM LOAD ──
document.addEventListener('DOMContentLoaded', async () => {
  initAmbientCanvas();
  showCheckinPopup();

  // Rotate affirmation every 8s
  setInterval(cycleAffirmation, 8000);

  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      currentUser = data;
      updateNav();
      loadUserSessions();
      updateStreak();
    }
  } catch(e) { console.error(e); }

  document.getElementById('sidebar-date').textContent =
    new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});
});

// ── NAVIGATION ──
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const link = Array.from(document.querySelectorAll('.nav-link')).find(
    l => l.getAttribute('onclick') && l.getAttribute('onclick').includes(id)
  );
  if (link) link.classList.add('active');

  window.scrollTo(0,0);

  if (id === 'chat-page') {
    if (currentUser && !currentSessionId) {
      createNewSession().then(() => { initChat(); loadWeeklyMiniChart(); });
    } else if (currentUser) {
      loadWeeklyMiniChart();
    }
  } else if (id === 'mood-page') {
    loadMoodData();
  } else if (id === 'resources-page') {
    renderResources();
  }
}

window.addEventListener('scroll', () => {
  const nav = document.getElementById('topnav');
  if (window.scrollY > 20) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
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
    anonBtn.style.display='block'; divi.style.display='flex';
    submitBtn.textContent = 'Sign In';
  } else if (mode === 'signup') {
    email.style.display='block'; pwd.style.display='block'; conf.style.display='block';
    anonBtn.style.display='block'; divi.style.display='flex';
    submitBtn.textContent = 'Create Account';
  } else if (mode === 'anon') {
    email.style.display='none'; pwd.style.display='none'; conf.style.display='none';
    anonBtn.style.display='none'; divi.style.display='none';
    submitBtn.textContent = 'Continue Anonymously';
  }
}

function updateNav() {
  const nameEl = document.getElementById('nav-username');
  const startBtn = document.getElementById('nav-btn-start');
  const logoutBtn = document.getElementById('nav-btn-logout');
  if (currentUser) {
    nameEl.textContent = `Hi, ${currentUser.username}`;
    nameEl.style.display = 'inline';
    startBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-flex';
  } else {
    nameEl.style.display = 'none';
    startBtn.style.display = 'inline-flex';
    logoutBtn.style.display = 'none';
  }
}

// ── AUTH ──
function getModalTab() {
  return document.querySelector('.mtab.active').id.replace('mtab-', '');
}

async function handleModalSubmit() {
  const mode = getModalTab();
  if (mode === 'login') await handleLogin();
  else if (mode === 'signup') await handleSignup();
  else if (mode === 'anon') await handleAnonymous();
}

async function handleSignup() {
  const email = document.getElementById('modal-email').value;
  const password = document.getElementById('modal-password').value;
  const confirm = document.getElementById('modal-confirm').value;
  const err = document.getElementById('modal-error');
  if (password !== confirm) { err.textContent="Passwords do not match"; err.style.display='block'; return; }
  try {
    const res = await fetch('/api/auth/signup', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email, password})
    });
    const data = await res.json();
    if (res.ok) {
      currentUser = data.user; updateNav(); closeModal();
      await createNewSession(); showPage('chat-page');
      document.getElementById('modal-email').value='';
      document.getElementById('modal-password').value='';
      document.getElementById('modal-confirm').value='';
      showToast('💚 Welcome to Serenity!');
    } else { err.textContent=data.error; err.style.display='block'; }
  } catch(e) { err.textContent="Network error"; err.style.display='block'; }
}

async function handleLogin() {
  const email = document.getElementById('modal-email').value;
  const password = document.getElementById('modal-password').value;
  const err = document.getElementById('modal-error');
  try {
    const res = await fetch('/api/auth/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email, password})
    });
    const data = await res.json();
    if (res.ok) {
      currentUser = data.user; updateNav(); closeModal();
      await loadUserSessions(); showPage('chat-page');
      document.getElementById('modal-email').value='';
      document.getElementById('modal-password').value='';
      showToast(`💚 Welcome back, ${currentUser.username}!`);
      updateStreak();
    } else { err.textContent=data.error; err.style.display='block'; }
  } catch(e) { err.textContent="Network error"; err.style.display='block'; }
}

async function handleAnonymous() {
  const err = document.getElementById('modal-error');
  try {
    const res = await fetch('/api/auth/anonymous', {method:'POST'});
    const data = await res.json();
    if (res.ok) {
      currentUser = data.user; updateNav(); closeModal();
      await createNewSession(); showPage('chat-page');
      showToast('🎭 Anonymous session started');
    } else { err.textContent=data.error; err.style.display='block'; }
  } catch(e) { err.textContent="Network error"; err.style.display='block'; }
}

async function logout() {
  await fetch('/api/auth/logout', {method:'POST'});
  currentUser = null; currentSessionId = null; chatStarted = false;
  updateNav(); showPage('landing');
  document.getElementById('chat-messages').innerHTML='';
  document.getElementById('session-list').innerHTML='';
}

// ── SESSIONS ──
async function createNewSession() {
  if (!currentUser) { openModal(); return; }
  try {
    const res = await fetch('/api/sessions', {method:'POST'});
    const data = await res.json();
    currentSessionId = data.session._id;
    document.getElementById('chat-messages').innerHTML='';
    chatStarted = false;
    initChat();
    await loadUserSessions();
  } catch(e) { console.error(e); }
}

async function loadUserSessions() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/sessions');
    const data = await res.json();
    const list = document.getElementById('session-list');
    list.innerHTML = '';
    data.sessions.forEach(s => {
      const div = document.createElement('div');
      div.className = 'session-item' + (s._id === currentSessionId ? ' active' : '');
      div.onclick = () => loadSession(s._id);
      div.innerHTML = `<div class="s-title">${s.title}</div><div class="s-date">${formatDate(s.updated_at)}</div>`;
      list.appendChild(div);
    });
  } catch(e) { console.error(e); }
}

async function loadSession(id) {
  currentSessionId = id;
  try {
    const res = await fetch(`/api/sessions/${id}/messages`);
    const data = await res.json();
    const box = document.getElementById('chat-messages');
    box.innerHTML = '<div class="date-divider">Today</div>';
    data.messages.forEach(m => {
      if (m.role === 'user') appendUser(m.content, m.created_at);
      else appendAI(m.content, false, m.created_at);
    });
    chatStarted = data.messages.length > 0;
    loadUserSessions();
    setTimeout(() => box.scrollTop = box.scrollHeight, 100);
  } catch(e) { console.error(e); }
}

// ── CHAT ──
function initChat() {
  if (chatStarted) return;
  chatStarted = true;
  // Typewriter-style welcome
  const welcomeMsg = "Hi there 💚 I'm Serenity, your compassionate AI companion. This is a completely safe and private space — no judgment, just understanding and support.\n\nHow are you feeling right now?";
  appendAITyped(welcomeMsg, new Date().toISOString());
}

function handleEnter(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendClick(); }
}

async function handleSendClick() {
  const input = document.getElementById('chat-input');
  sendMessage(input.value);
}

async function sendMessage(text) {
  if (isLoading || !text.trim()) return;
  if (!currentUser) { openModal(); return; }
  if (!currentSessionId) { await createNewSession(); }

  isLoading = true;
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  input.value = ''; autoResize(input);
  input.disabled = true; sendBtn.disabled = true;
  sendBtn.classList.add('sending');

  appendUser(text, new Date().toISOString());
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({message: text, session_id: currentSessionId})
    });
    const data = await res.json();
    hideTyping();
    if (res.ok) {
      appendAI(data.reply, false, new Date().toISOString());
    } else {
      appendAI("I'm sorry, I had trouble connecting. 💙 " + (data.error || 'Please try again.'), false, new Date().toISOString());
    }
  } catch(e) {
    hideTyping();
    appendAI("Something went wrong. Please try again. 💙", false, new Date().toISOString());
  } finally {
    isLoading = false;
    input.disabled = false; sendBtn.disabled = false;
    sendBtn.classList.remove('sending');
    input.focus();
    loadUserSessions();
  }
}

function sanitize(str) {
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
}

function formatText(str) {
  let html = sanitize(str).replace(/\n/g, '<br>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return html;
}

function extractTime(iso) {
  if (!iso) return now();
  const d = new Date(iso);
  if (isNaN(d.getTime())) return now();
  return d.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'});
}

// Typewriter effect for AI welcome message
function appendAITyped(text, isoTime) {
  const box = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'cmsg ai';
  div.innerHTML = `
    <div class="c-avatar ai">🌿</div>
    <div class="cmsg-body">
      <div class="cmsg-bubble" id="typed-bubble"></div>
      <div class="cmsg-time">${extractTime(isoTime)}</div>
    </div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;

  const bubble = document.getElementById('typed-bubble');
  const lines = text.split('\n');
  let lineIdx = 0, charIdx = 0;
  let displayed = '';

  const type = setInterval(() => {
    if (lineIdx >= lines.length) { clearInterval(type); return; }
    const line = lines[lineIdx];
    if (charIdx < line.length) {
      displayed += line[charIdx];
      charIdx++;
    } else {
      displayed += '\n';
      lineIdx++; charIdx = 0;
    }
    bubble.innerHTML = formatText(displayed);
    box.scrollTop = box.scrollHeight;
  }, 18);
}

function appendAI(text, withSuggestions, isoTime) {
  const box = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'cmsg ai';
  div.innerHTML = `
    <div class="c-avatar ai">🌿</div>
    <div class="cmsg-body">
      <div class="cmsg-bubble">
        ${formatText(text)}
        <div class="msg-reaction-bar">
          <span title="Helpful" onclick="reactMsg(this,'💚')">💚</span>
          <span title="Comforting" onclick="reactMsg(this,'🌿')">🌿</span>
          <span title="Thank you" onclick="reactMsg(this,'🙏')">🙏</span>
          <span title="Insightful" onclick="reactMsg(this,'💡')">💡</span>
        </div>
      </div>
      <div class="cmsg-time">${extractTime(isoTime)}</div>
    </div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function reactMsg(btn, emoji) {
  const bar = btn.closest('.msg-reaction-bar');
  bar.innerHTML = `<span style="font-size:16px">${emoji} Reacted</span>`;
  showToast(`${emoji} Reaction sent`);
}

function appendUser(text, isoTime) {
  const box = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'cmsg user';
  div.innerHTML = `
    <div class="c-avatar u">You</div>
    <div class="cmsg-body">
      <div class="cmsg-bubble">${formatText(text)}</div>
      <div class="cmsg-time">${extractTime(isoTime)}</div>
    </div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function showTyping() {
  const box = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.id = 'typing-ind';
  div.className = 'cmsg ai';
  div.innerHTML = `
    <div class="c-avatar ai">🌿</div>
    <div class="cmsg-body">
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    </div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function hideTyping() {
  const ind = document.getElementById('typing-ind');
  if (ind) ind.remove();
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ── MOOD SIDEBAR ──
function setMiniMood(btn) {
  document.querySelectorAll('.mood-mini-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}

// ── MOOD PAGE ──
async function loadMoodData() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/mood');
    const data = await res.json();
    buildBigChart(data.weekly);
    updateMoodStats(data.stats);
    renderRecentEntries(data.entries.slice(0,5));
    buildEmoChips();
  } catch(e) { console.error(e); }
}

async function loadWeeklyMiniChart() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/mood');
    const data = await res.json();
    buildMiniChart(data.weekly);
  } catch(e) {}
}

function getMoodColor(mood) {
  const m = { 'Happy':'#FFD166', 'Calm':'#A8D5BA', 'Sad':'#A8C8E8', 'Anxious':'#C5B8E8', 'Angry':'#F4978E' };
  return m[mood] || '#E8E4DE';
}

function getMoodEmoji(mood) {
  const m = { 'Happy':'😊', 'Calm':'😌', 'Sad':'😔', 'Anxious':'😰', 'Angry':'😤' };
  return m[mood] || '😐';
}

function buildBigChart(weekly) {
  const box = document.getElementById('big-bar-chart');
  box.innerHTML = '';
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const map = {};
  weekly.forEach(w => {
    const d = new Date(w.logged_at).getDay();
    const adjusted = d === 0 ? 6 : d - 1;
    if (!map[adjusted] || w.mood_score > map[adjusted].mood_score) map[adjusted] = w;
  });
  days.forEach((day, i) => {
    const entry = map[i];
    const col = document.createElement('div');
    col.className = 'bar-col';
    if (entry) {
      const h = entry.mood_score * 28 + 'px';
      const c = getMoodColor(entry.mood);
      col.innerHTML = `
        <div class="bar-val" style="color:${c}">${entry.mood_score}</div>
        <div class="bar-div" style="height:${h}; background:${c};" title="${entry.mood}"></div>
        <div class="bar-day">${day}</div>
      `;
    } else {
      col.innerHTML = `
        <div class="bar-div" style="height:14px; background:rgba(122,120,112,0.2);"></div>
        <div class="bar-day">${day}</div>
      `;
    }
    box.appendChild(col);
  });
}

function buildMiniChart(weekly) {
  const box = document.getElementById('right-mini-bars');
  if (!box) return;
  box.innerHTML = '';
  const days = ['M','T','W','T','F','S','S'];
  const map = {};
  weekly.forEach(w => {
    const d = new Date(w.logged_at).getDay();
    const adjusted = d === 0 ? 6 : d - 1;
    if (!map[adjusted] || w.mood_score > map[adjusted].mood_score) map[adjusted] = w;
  });
  days.forEach((day, i) => {
    const entry = map[i];
    const col = document.createElement('div');
    col.className = 'bar-col';
    if (entry) {
      const h = entry.mood_score * 10 + 'px';
      const c = getMoodColor(entry.mood);
      col.innerHTML = `
        <div class="bar-div" style="height:${h}; background:${c};"></div>
        <div class="bar-day" style="font-size:9px">${day}</div>
      `;
    } else {
      col.innerHTML = `
        <div class="bar-div" style="height:6px; background:rgba(122,120,112,0.2);"></div>
        <div class="bar-day" style="font-size:9px">${day}</div>
      `;
    }
    box.appendChild(col);
  });
}

function updateMoodStats(stats) {
  document.getElementById('stat-avg').textContent = stats.avg_score || '--';
  document.getElementById('stat-days').textContent = stats.days_logged || '0';
  document.getElementById('stat-mood').textContent = getMoodEmoji(stats.most_common_mood);
  document.getElementById('stat-mood-text').textContent = stats.most_common_mood !== 'None' ? stats.most_common_mood : '–';
}

function renderRecentEntries(entries) {
  const box = document.getElementById('recent-entries');
  box.innerHTML = '';
  if (entries.length === 0) {
    box.innerHTML = '<div class="empty-msg">No entries yet. Log your first mood above.</div>';
    return;
  }
  entries.forEach(e => {
    const div = document.createElement('div');
    div.className = 'ml-r-item';
    div.innerHTML = `
      <div class="ml-r-emoji">${getMoodEmoji(e.mood)}</div>
      <div class="ml-r-info">
        <div class="ml-r-top">
          <span class="ml-r-date">${formatDate(e.logged_at)}</span>
          <span class="ml-r-badge" style="background:${getMoodColor(e.mood)}33; color:${getMoodColor(e.mood)}">${e.mood}</span>
        </div>
        <div class="ml-r-note">${sanitize(e.note || "No note added")}</div>
      </div>
    `;
    box.appendChild(div);
  });
}

function buildEmoChips() {
  const box = document.getElementById('emo-chips');
  if (box.children.length > 0) return;
  const emos = [
    "😊 Joyful","😌 Peaceful","😔 Down","😰 Worried","😤 Frustrated",
    "😕 Confused","🥰 Grateful","😴 Tired","😤 Irritable","🤗 Connected"
  ];
  emos.forEach(e => {
    const span = document.createElement('span');
    span.className = 'emo-chip';
    span.textContent = e;
    span.onclick = () => {
      const txt = e.split(' ')[1];
      if (selectedEmotions.includes(txt)) {
        selectedEmotions = selectedEmotions.filter(x => x !== txt);
        span.classList.remove('sel');
      } else {
        selectedEmotions.push(txt);
        span.classList.add('sel');
      }
    };
    box.appendChild(span);
  });
}

function selectMood(mood, score, btn) {
  selectedMood = mood;
  selectedMoodScore = score;
  document.querySelectorAll('.ml-ms-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}

async function saveMoodEntry() {
  if (!currentUser) { openModal(); return; }
  const msg = document.getElementById('save-mood-msg');
  if (!selectedMood) {
    msg.textContent = "Please select a mood";
    msg.style.color = "#C0392B";
    msg.style.display = 'block';
    return;
  }
  const note = document.getElementById('mood-journal').value;
  try {
    const res = await fetch('/api/mood', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({mood: selectedMood, mood_score: selectedMoodScore, note, emotions: selectedEmotions})
    });
    if (res.ok) {
      msg.textContent = "Entry saved! 💚";
      msg.style.color = "var(--sage)";
      msg.style.display = 'block';
      setTimeout(() => { msg.style.display='none'; }, 3000);
      document.getElementById('mood-journal').value = '';
      document.querySelectorAll('.ml-ms-btn').forEach(b => b.classList.remove('sel'));
      document.querySelectorAll('.emo-chip').forEach(b => b.classList.remove('sel'));
      selectedMood = null; selectedEmotions = [];
      loadMoodData();
      updateStreak();
      showToast('💚 Mood entry saved!');
    }
  } catch(e) { console.error(e); }
}

// ── RESOURCES ──
function filterRes(btn, cat) {
  document.querySelectorAll('.rf-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = cat;
  renderResources();
}

function renderResources() {
  const box = document.getElementById('res-grid');
  box.innerHTML = '';
  const filtered = currentFilter === 'all' ? RESOURCES : RESOURCES.filter(r => r.cat === currentFilter);
  filtered.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'res-card';
    div.style.animationDelay = `${i * 0.06}s`;
    div.style.animation = 'fadeUp 0.4s ease forwards';
    div.style.opacity = '0';
    div.innerHTML = `
      <div class="rc-header">
        <span class="rc-emoji">${r.emoji}</span>
        <span class="rc-badge" style="background:${r.badgeColor};">${r.badge}</span>
      </div>
      <h3>${r.title}</h3>
      <p>${r.desc}</p>
      <div class="rc-footer">
        <span class="rc-time">⏱ ${r.time}</span>
        <span class="rc-link">Open →</span>
      </div>
    `;
    box.appendChild(div);
  });
}

// ── UTILS ──
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const n = new Date();
  const diff = Math.floor((n - d) / (1000 * 60 * 60 * 24));
  const t = d.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'});
  if (diff === 0 && d.getDate() === n.getDate()) return `Today ${t}`;
  if (diff === 1 || (diff === 0 && d.getDate() !== n.getDate())) return `Yesterday ${t}`;
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', {month:'short', day:'numeric'}) + ` ${t}`;
}

function now() {
  return new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
}

function showToast(message) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = 'toast-notification';
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transform = 'translateY(10px)';
    div.style.transition = 'all 0.3s ease';
    setTimeout(() => div.remove(), 300);
  }, 3000);
}
