// State
let currentUser = null;
let currentSessionId = null;
let selectedMood = null;
let selectedMoodScore = 3;
let currentFilter = 'all';

// Resources Data
const RESOURCES = [
  { 
    id: 1, 
    type: 'article', 
    title: 'Understanding Anxiety Disorders', 
    desc: 'Comprehensive guide to recognizing anxiety symptoms, understanding triggers, and learning evidence-based coping strategies.', 
    time: '8 min read',
    url: 'https://www.nimh.nih.gov/health/topics/anxiety-disorders',
    content: 'Anxiety disorders are the most common mental health concern in the United States. Learn about different types including GAD, panic disorder, and social anxiety.'
  },
  { 
    id: 2, 
    type: 'exercise', 
    title: '5-Minute Guided Meditation', 
    desc: 'Quick body scan meditation to release tension and find calm in your busy day.', 
    time: '5 min',
    url: 'javascript:startMeditation()',
    content: 'A simple meditation practice you can do anywhere, anytime. Perfect for beginners.'
  },
  { 
    id: 3, 
    type: 'guide', 
    title: 'Sleep Hygiene Guide', 
    desc: 'Evidence-based strategies to improve sleep quality and reduce nighttime anxiety.', 
    time: '10 min read',
    url: 'https://www.sleepfoundation.org/sleep-hygiene',
    content: 'Learn about sleep cycles, bedroom environment, and habits that promote restful sleep.'
  },
  { 
    id: 4, 
    type: 'tool', 
    title: 'Thought Journal', 
    desc: 'Interactive tool to track and reframe negative thought patterns using CBT techniques.', 
    time: 'Interactive',
    url: 'javascript:openThoughtJournal()',
    content: 'Cognitive Behavioral Therapy tool to identify and challenge unhelpful thoughts.'
  },
  { 
    id: 5, 
    type: 'article', 
    title: 'Building Emotional Resilience', 
    desc: 'Practical strategies to strengthen your ability to bounce back from life\'s challenges.', 
    time: '12 min read',
    url: 'https://www.apa.org/topics/resilience',
    content: 'Resilience is the ability to adapt to difficult situations. Learn how to build this crucial skill.'
  },
  { 
    id: 6, 
    type: 'exercise', 
    title: 'Box Breathing Technique', 
    desc: 'Navy SEAL breathing method: 4 seconds in, 4 hold, 4 out, 4 hold. Instant calm.', 
    time: '3 min',
    url: 'javascript:startBoxBreathing()',
    content: 'Used by military and first responders to stay calm under pressure.'
  },
  { 
    id: 7, 
    type: 'guide', 
    title: 'Mindfulness for Beginners', 
    desc: 'Complete introduction to mindfulness meditation and its mental health benefits.', 
    time: '15 min',
    url: 'https://www.mindful.org/meditation/mindfulness-getting-started/',
    content: 'Start your mindfulness journey with this comprehensive beginner\'s guide.'
  },
  { 
    id: 8, 
    type: 'tool', 
    title: 'Gratitude Journal', 
    desc: 'Daily gratitude practice tool to shift focus toward positive aspects of life.', 
    time: 'Daily',
    url: 'javascript:openGratitudeJournal()',
    content: 'Research shows gratitude practice improves mental health and life satisfaction.'
  },
  { 
    id: 9, 
    type: 'article', 
    title: 'Managing Workplace Stress', 
    desc: 'Practical techniques for handling work-related stress and preventing burnout.', 
    time: '9 min read',
    url: 'https://www.helpguide.org/articles/stress/stress-in-the-workplace.htm',
    content: 'Learn to set boundaries, manage time, and maintain work-life balance.'
  },
  { 
    id: 10, 
    type: 'exercise', 
    title: 'Progressive Muscle Relaxation', 
    desc: 'Systematic tension and release technique to reduce physical stress and anxiety.', 
    time: '10 min',
    url: 'javascript:startPMR()',
    content: 'Tense and relax muscle groups to release physical tension and calm your mind.'
  },
  { 
    id: 11, 
    type: 'guide', 
    title: 'Dealing with Depression', 
    desc: 'Understanding depression symptoms, treatment options, and self-help strategies.', 
    time: '20 min read',
    url: 'https://www.nimh.nih.gov/health/topics/depression',
    content: 'Comprehensive guide to recognizing and managing depression with professional support.'
  },
  { 
    id: 12, 
    type: 'tool', 
    title: 'Panic Attack First Aid', 
    desc: 'Step-by-step guide for managing panic attacks when they occur.', 
    time: 'Emergency',
    url: 'javascript:openPanicGuide()',
    content: 'Immediate strategies to use during a panic attack to regain control.'
  }
];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      currentUser = await res.json();
      updateAuthUI();
      loadUserSessions();
      updateStreak();
    }
  } catch (e) {
    console.error('Auth check failed:', e);
  }
  renderResources();
  loadPlatformStats();
});

// Load Platform Statistics
async function loadPlatformStats() {
  try {
    const res = await fetch('/api/stats');
    if (res.ok) {
      const stats = await res.json();
      
      // Update hero stats
      document.getElementById('stat-users').textContent = stats.active_users || 0;
      document.getElementById('stat-messages').textContent = formatNumber(stats.total_messages || 0);
      document.getElementById('stat-moods').textContent = formatNumber(stats.total_moods || 0);
      
      // Render mood distribution chart
      renderMoodChart(stats.mood_distribution || []);
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
    // Show placeholder values
    document.getElementById('stat-users').textContent = '0';
    document.getElementById('stat-messages').textContent = '0';
    document.getElementById('stat-moods').textContent = '0';
  }
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

let moodDoughnutChart = null;
let moodBarChart = null;

const MOOD_COLORS = {
  'Happy':   { bg: '#fbbf24', border: '#f59e0b' },
  'Calm':    { bg: '#34d399', border: '#10b981' },
  'Sad':     { bg: '#60a5fa', border: '#3b82f6' },
  'Anxious': { bg: '#a78bfa', border: '#8b5cf6' },
  'Angry':   { bg: '#f87171', border: '#ef4444' }
};

function renderMoodChart(moodData) {
  const wrapper = document.getElementById('mood-charts-wrapper');
  const empty = document.getElementById('mood-chart-empty');

  if (!wrapper) return;

  if (moodData.length === 0) {
    wrapper.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }

  wrapper.style.display = 'grid';
  if (empty) empty.style.display = 'none';

  const ALL_MOODS = ['Happy', 'Calm', 'Sad', 'Anxious', 'Angry'];
  const countMap = {};
  moodData.forEach(m => { countMap[m._id] = m.count; });

  const labels = ALL_MOODS.filter(m => countMap[m] !== undefined);
  const counts = labels.map(m => countMap[m] || 0);
  const total = counts.reduce((a, b) => a + b, 0);
  const bgColors = labels.map(m => (MOOD_COLORS[m] || { bg: '#94a3b8' }).bg);
  const borderColors = labels.map(m => (MOOD_COLORS[m] || { border: '#64748b' }).border);

  const totalEl = document.getElementById('mood-total-count');
  if (totalEl) totalEl.textContent = total;

  const doughnutCanvas = document.getElementById('mood-doughnut-chart');
  const barCanvas = document.getElementById('mood-bar-chart');
  if (!doughnutCanvas || !barCanvas) return;

  const commonFont = { family: "'Inter', sans-serif" };

  if (moodDoughnutChart) moodDoughnutChart.destroy();
  moodDoughnutChart = new Chart(doughnutCanvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
              return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
            }
          },
          bodyFont: commonFont,
          titleFont: commonFont
        }
      },
      animation: { animateRotate: true, duration: 800 }
    }
  });

  if (moodBarChart) moodBarChart.destroy();
  moodBarChart = new Chart(barCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Entries',
        data: counts,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.parsed.y} entries` },
          bodyFont: commonFont,
          titleFont: commonFont
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { ...commonFont, size: 12 }, color: '#64748b' },
          border: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: { ...commonFont, size: 11 },
            color: '#94a3b8',
            stepSize: 1,
            precision: 0
          },
          grid: { color: '#f1f5f9' },
          border: { display: false }
        }
      },
      animation: { duration: 800 }
    }
  });
}

// Page Navigation
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const link = document.querySelector(`.nav-links a[onclick*="${pageId}"]`);
  if (link) link.classList.add('active');
  
  if (pageId === 'chat' && currentUser && !currentSessionId) {
    createNewSession();
  } else if (pageId === 'mood') {
    loadMoodData();
  }
}

// Auth Functions
function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('email').focus(), 100);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('form-error').classList.remove('show');
}

function handleOverlayClick(e) {
  if (e.target.id === 'modal-overlay') closeModal();
}

function switchTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  
  const emailGroup = document.getElementById('email').parentElement;
  const passwordGroup = document.getElementById('password').parentElement;
  const confirmGroup = document.getElementById('confirm-group');
  const submitBtn = document.getElementById('submit-btn');
  
  if (tab === 'anon') {
    emailGroup.style.display = 'none';
    passwordGroup.style.display = 'none';
    confirmGroup.style.display = 'none';
    submitBtn.textContent = 'Continue Anonymously';
  } else {
    emailGroup.style.display = 'block';
    passwordGroup.style.display = 'block';
    confirmGroup.style.display = tab === 'signup' ? 'block' : 'none';
    submitBtn.textContent = tab === 'signup' ? 'Create Account' : 'Sign In';
  }
  
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';
  document.getElementById('confirm').value = '';
  document.getElementById('form-error').classList.remove('show');
}

async function handleAuth() {
  const activeTab = document.querySelector('.modal-tab.active').id.replace('tab-', '');
  const submitBtn = document.getElementById('submit-btn');
  const errorEl = document.getElementById('form-error');
  
  errorEl.classList.remove('show');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span>';
  
  try {
    if (activeTab === 'anon') {
      const res = await fetch('/api/auth/anonymous', { method: 'POST' });
      if (!res.ok) throw new Error('Anonymous login failed');
      currentUser = await res.json();
      closeModal();
      updateAuthUI();
      showToast('Welcome! Chatting anonymously.');
      showPage('chat');
    } else {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email');
      }
      
      if (activeTab === 'signup') {
        const confirm = document.getElementById('confirm').value;
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        if (password !== confirm) throw new Error('Passwords do not match');
        
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username: email.split('@')[0] })
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Registration failed');
        }
        
        currentUser = await res.json();
        closeModal();
        updateAuthUI();
        showToast('Welcome to MindSpace!');
        showPage('chat');
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Invalid credentials');
        }
        
        currentUser = await res.json();
        closeModal();
        updateAuthUI();
        loadUserSessions();
        updateStreak();
        showToast('Welcome back!');
        showPage('chat');
      }
    }
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.classList.add('show');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = activeTab === 'anon' ? 'Continue Anonymously' : 
                           activeTab === 'signup' ? 'Create Account' : 'Sign In';
  }
}

function updateAuthUI() {
  const userName = document.getElementById('user-name');
  const authBtn = document.getElementById('auth-btn');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (currentUser) {
    userName.textContent = `Hi, ${currentUser.username || 'User'}`;
    userName.style.display = 'inline';
    authBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-flex';
  } else {
    userName.style.display = 'none';
    authBtn.style.display = 'inline-flex';
    logoutBtn.style.display = 'none';
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {}
  currentUser = null;
  currentSessionId = null;
  updateAuthUI();
  document.getElementById('session-list').innerHTML = '';
  document.getElementById('chat-messages').innerHTML = '';
  showPage('home');
  showToast('Logged out successfully');
}

// Chat Functions
async function createNewSession() {
  if (!currentUser) {
    openModal();
    return;
  }
  
  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Conversation' })
    });
    
    if (!res.ok) throw new Error('Failed to create session');
    
    const data = await res.json();
    const sess = data.session || data;
    currentSessionId = sess._id || sess.id;
    document.getElementById('chat-messages').innerHTML = '';
    initChat();
    loadUserSessions();
  } catch (error) {
    showToast('Failed to create chat session');
  }
}

async function loadUserSessions() {
  if (!currentUser) return;
  
  try {
    const res = await fetch('/api/sessions');
    if (!res.ok) throw new Error('Failed to load sessions');
    
    const data = await res.json();
    const list = document.getElementById('session-list');
    const sessions = data.sessions || [];
    
    if (sessions.length === 0) {
      list.innerHTML = '<p style="text-align:center; color:#64748b; font-size:14px; padding:20px;">No conversations yet</p>';
      return;
    }
    
    list.innerHTML = sessions.slice(0, 10).map(s => `
      <div style="padding:12px; background:#f8fafc; border-radius:12px; margin-bottom:8px; cursor:pointer; transition:all 0.3s;" 
           onclick="loadSession('${s._id || s.id}')"
           onmouseover="this.style.background='#e2e8f0'" 
           onmouseout="this.style.background='#f8fafc'">
        <div style="font-weight:600; font-size:14px; margin-bottom:4px;">${sanitize(s.title || 'Conversation')}</div>
        <div style="font-size:12px; color:#64748b;">${formatDate(s.created_at)}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Load sessions error:', error);
  }
}

async function loadSession(id) {
  currentSessionId = id;
  const msgs = document.getElementById('chat-messages');
  msgs.innerHTML = '<p style="text-align:center; color:#64748b; padding:40px;">Loading...</p>';
  
  try {
    const res = await fetch(`/api/sessions/${id}/messages`);
    if (!res.ok) throw new Error('Failed to load messages');
    
    const data = await res.json();
    msgs.innerHTML = '';
    
    const messages = data.messages || [];
    if (messages.length === 0) {
      initChat();
    } else {
      messages.forEach(m => {
        if (m.role === 'user') {
          appendMessage(m.content, 'user');
        } else {
          appendMessage(m.content, 'ai');
        }
      });
    }
  } catch (error) {
    msgs.innerHTML = '<p style="text-align:center; color:#ef4444; padding:40px;">Failed to load conversation</p>';
  }
}

function initChat() {
  appendMessage("Hello! I'm your MindSpace AI companion. I'm here to listen and support you. How are you feeling today?", 'ai');
}

function handleEnter(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendClick();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

async function handleSendClick() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  
  if (!text) return;
  if (!currentUser) {
    openModal();
    return;
  }
  if (!currentSessionId) {
    await createNewSession();
    if (!currentSessionId) {
      showToast('Failed to create session');
      return;
    }
  }
  
  input.value = '';
  autoResize(input);
  
  appendMessage(text, 'user');
  
  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<span class="loading"></span>';
  
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: text,
        session_id: currentSessionId
      })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to send message');
    }
    
    const data = await res.json();
    appendMessage(data.reply || 'I understand. Tell me more.', 'ai');
    loadUserSessions(); // Refresh session list
  } catch (error) {
    console.error('Chat error:', error);
    appendMessage('I apologize, but I\'m having trouble connecting right now. Please check your API key configuration and try again.', 'ai');
    showToast(error.message || 'Failed to send message');
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
  }
}

function appendMessage(text, type) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `message ${type}`;
  
  const avatar = type === 'ai' ? '🤖' : '👤';
  
  div.innerHTML = `
    <div class="message-avatar ${type}" style="display:flex; align-items:center; justify-content:center; color:white; font-size:20px;">${avatar}</div>
    <div class="message-content">${sanitize(text).replace(/\n/g, '<br>')}</div>
  `;
  
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// Mood Functions
function selectMood(mood, score, el) {
  selectedMood = mood;
  selectedMoodScore = score;
  
  document.querySelectorAll('.mood-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

async function saveMood() {
  if (!selectedMood) {
    showToast('Please select a mood first');
    return;
  }
  if (!currentUser) {
    openModal();
    return;
  }
  
  const note = document.getElementById('mood-note').value.trim();
  
  try {
    const res = await fetch('/api/mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mood: selectedMood,
        mood_score: selectedMoodScore,
        note,
        emotions: []
      })
    });
    
    if (!res.ok) throw new Error('Failed to save mood');
    
    showToast('Mood saved successfully!');
    document.getElementById('mood-note').value = '';
    selectedMood = null;
    document.querySelectorAll('.mood-card').forEach(c => c.classList.remove('selected'));
    loadMoodData();
    updateStreak();
  } catch (error) {
    showToast('Failed to save mood. Please try again.');
  }
}

async function loadMoodData() {
  if (!currentUser) return;
  
  try {
    const res = await fetch('/api/mood');
    if (!res.ok) throw new Error('Failed to load mood data');
    
    const data = await res.json();
    const entries = data.entries || [];
    
    // Update stats
    if (entries.length > 0) {
      const avgScore = (entries.reduce((sum, e) => sum + (e.mood_score || 3), 0) / entries.length).toFixed(1);
      document.getElementById('avg-mood').textContent = avgScore;
      document.getElementById('total-entries').textContent = entries.length;
    }
    
    // Render history
    const historyEl = document.getElementById('mood-history');
    if (entries.length === 0) {
      historyEl.innerHTML = '<p style="text-align:center; color:#64748b; padding:40px;">No mood entries yet. Start tracking above!</p>';
    } else {
      historyEl.innerHTML = entries.slice(0, 10).map(e => `
        <div style="background:white; padding:20px; border-radius:16px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-weight:700; font-size:18px;">${e.mood}</span>
            <span style="color:#64748b; font-size:14px;">${formatDate(e.logged_at)}</span>
          </div>
          ${e.note ? `<p style="color:#64748b;">${sanitize(e.note)}</p>` : ''}
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Load mood data error:', error);
  }
}

async function updateStreak() {
  if (!currentUser) return;
  
  try {
    const res = await fetch('/api/mood');
    const data = await res.json();
    const entries = data.entries || [];
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const found = entries.some(e => {
        const d = new Date(e.logged_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === day.getTime();
      });
      if (found) streak++;
      else break;
    }
    
    const streakEl = document.getElementById('streak-count');
    if (streakEl) streakEl.textContent = `${streak} days`;
    
    const streakDaysEl = document.getElementById('streak-days');
    if (streakDaysEl) streakDaysEl.textContent = streak;
  } catch (error) {
    console.error('Update streak error:', error);
  }
}

// Resources Functions
function filterResources(type, btn) {
  currentFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderResources();
}

function renderResources() {
  const grid = document.getElementById('resource-grid');
  const filtered = currentFilter === 'all' ? RESOURCES : RESOURCES.filter(r => r.type === currentFilter);
  
  grid.innerHTML = filtered.map(r => `
    <div class="resource-card ${r.type}" onclick="openResource(${r.id})">
      <h3 class="resource-title">${r.title}</h3>
      <p class="resource-desc">${r.desc}</p>
      <div class="resource-meta">
        <span>${r.time}</span>
        <span style="color:#6366f1; font-weight:600;">Open →</span>
      </div>
    </div>
  `).join('');
}

function openResource(id) {
  const resource = RESOURCES.find(r => r.id === id);
  if (!resource) return;
  
  // If it's a javascript: URL, execute the function
  if (resource.url.startsWith('javascript:')) {
    const funcName = resource.url.replace('javascript:', '').replace('()', '');
    if (window[funcName]) {
      window[funcName]();
    }
  } else {
    // Open external link in new tab
    window.open(resource.url, '_blank');
  }
}

// Interactive Tools
function startMeditation() {
  showResourceModal('5-Minute Guided Meditation', `
    <div style="text-align:center; padding:40px 20px;">
      <div style="font-size:72px; margin-bottom:24px;">🧘</div>
      <h3 style="margin-bottom:20px;">Body Scan Meditation</h3>
      <p style="color:#64748b; margin-bottom:32px; line-height:1.8;">
        Find a comfortable position. Close your eyes or soften your gaze.<br><br>
        Take three deep breaths...<br><br>
        Now, bring your attention to your feet. Notice any sensations.<br>
        Slowly move your awareness up through your legs, torso, arms, and head.<br><br>
        If your mind wanders, gently bring it back to your body.<br><br>
        Take your time. There's no rush.
      </p>
      <button class="btn btn-primary" onclick="closeResourceModal()">Complete</button>
    </div>
  `);
}

function startBoxBreathing() {
  let phase = 0;
  const phases = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];
  const duration = 4000;
  let cycles = 0;
  const maxCycles = 4;
  
  showResourceModal('Box Breathing Exercise', `
    <div style="text-align:center; padding:40px 20px;">
      <div style="width:200px; height:200px; margin:0 auto 32px; border:4px solid #6366f1; border-radius:20px; display:flex; align-items:center; justify-content:center; transition:all 1s ease;" id="breathing-box">
        <div style="font-size:48px;" id="breathing-emoji">💨</div>
      </div>
      <h3 id="breathing-phase" style="margin-bottom:12px; font-size:28px;">Breathe In</h3>
      <p style="color:#64748b; margin-bottom:32px;">4 seconds each phase</p>
      <div style="font-size:48px; font-weight:800; color:#6366f1; margin-bottom:24px;" id="breathing-count">4</div>
      <button class="btn btn-outline" onclick="closeResourceModal()">Stop</button>
    </div>
  `);
  
  const interval = setInterval(() => {
    const box = document.getElementById('breathing-box');
    const phaseEl = document.getElementById('breathing-phase');
    const emoji = document.getElementById('breathing-emoji');
    const countEl = document.getElementById('breathing-count');
    
    if (!box) {
      clearInterval(interval);
      return;
    }
    
    phase = (phase + 1) % 4;
    if (phase === 0) cycles++;
    
    if (cycles >= maxCycles) {
      clearInterval(interval);
      showToast('Great job! 4 cycles complete.');
      setTimeout(closeResourceModal, 2000);
      return;
    }
    
    phaseEl.textContent = phases[phase];
    
    // Visual feedback
    if (phase === 0) { // Breathe in
      box.style.transform = 'scale(1.3)';
      box.style.borderColor = '#6366f1';
      emoji.textContent = '💨';
    } else if (phase === 1) { // Hold
      emoji.textContent = '⏸️';
    } else if (phase === 2) { // Breathe out
      box.style.transform = 'scale(1)';
      box.style.borderColor = '#10b981';
      emoji.textContent = '😌';
    } else { // Hold
      emoji.textContent = '⏸️';
    }
    
    // Countdown
    let count = 4;
    countEl.textContent = count;
    const countInterval = setInterval(() => {
      count--;
      if (countEl) countEl.textContent = count;
      if (count <= 0) clearInterval(countInterval);
    }, 1000);
    
  }, duration);
}

function openThoughtJournal() {
  showResourceModal('Thought Journal - CBT Tool', `
    <div style="padding:20px;">
      <p style="color:#64748b; margin-bottom:24px;">Identify and challenge negative thoughts using Cognitive Behavioral Therapy techniques.</p>
      
      <div style="margin-bottom:20px;">
        <label style="display:block; font-weight:600; margin-bottom:8px;">What's the negative thought?</label>
        <textarea id="negative-thought" class="form-input" rows="3" placeholder="Example: I'm going to fail this presentation..."></textarea>
      </div>
      
      <div style="margin-bottom:20px;">
        <label style="display:block; font-weight:600; margin-bottom:8px;">What evidence supports this thought?</label>
        <textarea id="evidence-for" class="form-input" rows="2" placeholder="List facts that support this thought..."></textarea>
      </div>
      
      <div style="margin-bottom:20px;">
        <label style="display:block; font-weight:600; margin-bottom:8px;">What evidence contradicts this thought?</label>
        <textarea id="evidence-against" class="form-input" rows="2" placeholder="List facts that contradict this thought..."></textarea>
      </div>
      
      <div style="margin-bottom:24px;">
        <label style="display:block; font-weight:600; margin-bottom:8px;">Balanced thought:</label>
        <textarea id="balanced-thought" class="form-input" rows="3" placeholder="Reframe the thought in a more balanced way..."></textarea>
      </div>
      
      <button class="btn btn-primary" style="width:100%;" onclick="saveThoughtJournal()">Save Entry</button>
    </div>
  `);
}

function saveThoughtJournal() {
  const negative = document.getElementById('negative-thought').value;
  const evidenceFor = document.getElementById('evidence-for').value;
  const evidenceAgainst = document.getElementById('evidence-against').value;
  const balanced = document.getElementById('balanced-thought').value;
  
  if (!negative || !balanced) {
    showToast('Please fill in at least the thought and balanced reframe');
    return;
  }
  
  showToast('Thought journal entry saved!');
  closeResourceModal();
}

function openGratitudeJournal() {
  showResourceModal('Gratitude Journal', `
    <div style="padding:20px;">
      <p style="color:#64748b; margin-bottom:24px;">List 3 things you're grateful for today. Research shows this simple practice improves mental health.</p>
      
      <div style="margin-bottom:20px;">
        <label style="display:block; font-weight:600; margin-bottom:8px;">1. I'm grateful for...</label>
        <input type="text" id="gratitude-1" class="form-input" placeholder="Example: My morning coffee">
      </div>
      
      <div style="margin-bottom:20px;">
        <label style="display:block; font-weight:600; margin-bottom:8px;">2. I'm grateful for...</label>
        <input type="text" id="gratitude-2" class="form-input" placeholder="Example: A friend who listened">
      </div>
      
      <div style="margin-bottom:24px;">
        <label style="display:block; font-weight:600; margin-bottom:8px;">3. I'm grateful for...</label>
        <input type="text" id="gratitude-3" class="form-input" placeholder="Example: The sunshine today">
      </div>
      
      <button class="btn btn-primary" style="width:100%;" onclick="saveGratitude()">Save Gratitude Entry</button>
    </div>
  `);
}

function saveGratitude() {
  const g1 = document.getElementById('gratitude-1').value;
  const g2 = document.getElementById('gratitude-2').value;
  const g3 = document.getElementById('gratitude-3').value;
  
  if (!g1 || !g2 || !g3) {
    showToast('Please fill in all 3 gratitude items');
    return;
  }
  
  showToast('Gratitude entry saved! 🙏');
  closeResourceModal();
}

function startPMR() {
  showResourceModal('Progressive Muscle Relaxation', `
    <div style="text-align:center; padding:40px 20px;">
      <div style="font-size:72px; margin-bottom:24px;">💪</div>
      <h3 style="margin-bottom:20px;">Progressive Muscle Relaxation</h3>
      <p style="color:#64748b; margin-bottom:32px; line-height:1.8;">
        This technique involves tensing and relaxing muscle groups.<br><br>
        <strong>Instructions:</strong><br>
        1. Tense each muscle group for 5 seconds<br>
        2. Release and relax for 10 seconds<br>
        3. Notice the difference<br><br>
        Start with your feet and work up to your face.<br>
        Feet → Legs → Stomach → Chest → Arms → Shoulders → Face
      </p>
      <button class="btn btn-primary" onclick="closeResourceModal()">Got it</button>
    </div>
  `);
}

function openPanicGuide() {
  showResourceModal('Panic Attack First Aid', `
    <div style="padding:20px;">
      <div style="background:#fee2e2; border-left:4px solid #ef4444; padding:16px; border-radius:8px; margin-bottom:24px;">
        <strong style="color:#991b1b;">If you're in crisis, call 988 immediately</strong>
      </div>
      
      <h3 style="margin-bottom:16px;">During a Panic Attack:</h3>
      
      <div style="margin-bottom:16px; padding:16px; background:#f8fafc; border-radius:12px;">
        <strong>1. Recognize it's a panic attack</strong>
        <p style="color:#64748b; margin-top:8px;">Remind yourself: "This is anxiety. It will pass. I am safe."</p>
      </div>
      
      <div style="margin-bottom:16px; padding:16px; background:#f8fafc; border-radius:12px;">
        <strong>2. Focus on breathing</strong>
        <p style="color:#64748b; margin-top:8px;">Breathe in for 4, hold for 4, out for 4. Repeat.</p>
      </div>
      
      <div style="margin-bottom:16px; padding:16px; background:#f8fafc; border-radius:12px;">
        <strong>3. Ground yourself (5-4-3-2-1)</strong>
        <p style="color:#64748b; margin-top:8px;">
          Name 5 things you see<br>
          4 things you can touch<br>
          3 things you hear<br>
          2 things you smell<br>
          1 thing you taste
        </p>
      </div>
      
      <div style="margin-bottom:24px; padding:16px; background:#f8fafc; border-radius:12px;">
        <strong>4. Stay where you are</strong>
        <p style="color:#64748b; margin-top:8px;">Don't run away. The feeling will pass in 5-20 minutes.</p>
      </div>
      
      <button class="btn btn-primary" style="width:100%; margin-bottom:12px;" onclick="startBoxBreathing()">Start Breathing Exercise</button>
      <button class="btn btn-outline" style="width:100%;" onclick="closeResourceModal()">Close</button>
    </div>
  `);
}

// Resource Modal
function showResourceModal(title, content) {
  const modal = document.createElement('div');
  modal.id = 'resource-modal';
  modal.className = 'modal-overlay open';
  modal.innerHTML = `
    <div class="modal" style="max-width:600px;">
      <button onclick="closeResourceModal()" style="position:absolute; top:20px; right:20px; background:none; border:none; font-size:24px; cursor:pointer; color:#64748b;">&times;</button>
      <h2 style="margin-bottom:24px;">${title}</h2>
      ${content}
    </div>
  `;
  document.body.appendChild(modal);
}

function closeResourceModal() {
  const modal = document.getElementById('resource-modal');
  if (modal) modal.remove();
}

// Utility Functions
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Enter key support for modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('modal-overlay').classList.contains('open')) {
    const activeTab = document.querySelector('.modal-tab.active').id.replace('tab-', '');
    if (activeTab !== 'anon' && (e.target.id === 'email' || e.target.id === 'password' || e.target.id === 'confirm')) {
      handleAuth();
    }
  }
});
