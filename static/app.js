// State
let currentUser = null;
let currentSessionId = null;
let selectedMood = null;
let selectedMoodScore = 3;
let currentFilter = 'all';

// Resources Data
const RESOURCES = [
  { id: 1, type: 'article', title: 'Understanding Anxiety', desc: 'Learn about anxiety disorders and coping strategies.', time: '8 min read' },
  { id: 2, type: 'exercise', title: '5-Minute Meditation', desc: 'Quick meditation to calm your mind.', time: '5 min' },
  { id: 3, type: 'guide', title: 'Sleep Better Tonight', desc: 'Evidence-based tips for quality sleep.', time: '10 min read' },
  { id: 4, type: 'tool', title: 'Thought Journal', desc: 'Track and reframe negative thoughts.', time: 'Interactive' },
  { id: 5, type: 'article', title: 'Building Resilience', desc: 'Strengthen your mental fortitude.', time: '12 min read' },
  { id: 6, type: 'exercise', title: 'Box Breathing', desc: '4-4-4-4 breathing technique.', time: '3 min' },
  { id: 7, type: 'guide', title: 'Mindfulness 101', desc: 'Introduction to mindfulness practice.', time: '15 min' },
  { id: 8, type: 'tool', title: 'Mood Tracker', desc: 'Visual mood tracking tool.', time: 'Daily' },
  { id: 9, type: 'article', title: 'Managing Stress', desc: 'Practical stress management techniques.', time: '9 min read' }
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
});

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
    currentSessionId = data._id || data.id;
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
  }
  
  input.value = '';
  autoResize(input);
  
  appendMessage(text, 'user');
  
  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<span class="loading"></span>';
  
  try {
    const res = await fetch(`/api/sessions/${currentSessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    
    if (!res.ok) throw new Error('Failed to send message');
    
    const data = await res.json();
    appendMessage(data.response || data.message || 'I understand. Tell me more.', 'ai');
  } catch (error) {
    appendMessage('I apologize, but I\'m having trouble connecting right now. Please try again.', 'ai');
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
    <div class="resource-card ${r.type}">
      <h3 class="resource-title">${r.title}</h3>
      <p class="resource-desc">${r.desc}</p>
      <div class="resource-meta">
        <span>${r.time}</span>
        <span style="color:#6366f1; font-weight:600;">Read more →</span>
      </div>
    </div>
  `).join('');
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
