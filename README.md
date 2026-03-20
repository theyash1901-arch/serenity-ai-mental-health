# 🌿 Serenity AI — Mental Health Companion

> A compassionate, AI-powered mental wellness companion built with Flask and Google Gemini.  
> Chat anonymously, track your mood, journal your thoughts, and access crisis resources — all in one place.

---

## ✨ Features

| Feature | Description |
|---|---|
| 💬 **AI Chat (Gemini 2.5 Flash)** | Empathetic conversation with an AI trained to listen without judgment, available 24/7 |
| 📊 **Mood Tracker** | Log daily emotions, visualise weekly patterns with a bar chart, and track your emotional journey |
| ✍️ **Journaling** | A private space to process thoughts — mood-linked journal entries saved per session |
| 🌬️ **Breathing Widget** | 4-7-8 breathing exercise with an animated orb available inline in the chat view |
| 🔒 **Anonymous Mode** | Use the app with no account — no email, no commitment, complete privacy |
| 🚨 **Crisis Resources** | 988, Crisis Text Line (741741), and SAMHSA helpline always visible in the UI |
| 📚 **Resource Library** | Curated articles, exercises, guides, and tools filterable by category |

---

## 🗂️ Project Structure

```
serenity-ai/
├── app.py                  # Flask application — all API routes
├── database.py             # Database layer (in-memory by default)
├── models.py               # Data models: users, sessions, messages, mood, journal
├── test_chat.py            # End-to-end API smoke test (no dependencies)
│
├── templates/
│   └── index.html          # Single-page application shell (4 pages)
│
├── static/
│   ├── app.js              # All frontend logic — auth, chat, mood, resources
│   └── style.css           # Full design system with CSS variables
│
├── requirements.txt        # Python dependencies
├── render.yaml             # Render.com deployment config
├── .env.example            # Environment variable template
└── .gitignore
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Ayush29th/Mental-Health-ChatBot.git
cd Mental-Health-ChatBot
```

### 2. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
SECRET_KEY=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

> Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com/)

### 5. Run the app

```bash
python app.py
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🔌 API Reference

All endpoints are prefixed with `/api`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register with email + password |
| `POST` | `/api/auth/login` | Login with email + password |
| `POST` | `/api/auth/anonymous` | Create a no-account anonymous session |
| `POST` | `/api/auth/logout` | Clear session |
| `GET` | `/api/auth/me` | Get current logged-in user |

### Chat

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sessions` | Create a new chat session |
| `GET` | `/api/sessions` | List all sessions for current user |
| `GET` | `/api/sessions/<id>/messages` | Get all messages in a session |
| `POST` | `/api/chat` | Send a message and get an AI reply |

### Mood & Journal

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/mood` | Log a mood entry |
| `GET` | `/api/mood` | Get mood entries, weekly data, and stats |
| `POST` | `/api/journal` | Save a journal entry |
| `GET` | `/api/journal` | Get all journal entries |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Check server + API key status |

---

## 🧪 Running the Test

A quick smoke test hits the anonymous auth, session creation, and chat endpoints:

```bash
# Make sure the server is running first
python test_chat.py
```

---

## ☁️ Deployment

### Render.com (configured)

The `render.yaml` is already set up. Just:

1. Push to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your repository
4. Add environment variables in the Render dashboard:
   - `GEMINI_API_KEY`
   - `SECRET_KEY`
   - `MONGO_URI` (optional)

### Environment Variables Summary

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | ✅ | Flask session secret — use a long random string |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `MONGO_URI` | ❌ | MongoDB connection string (falls back to in-memory if absent) |

---

## 🧠 How the AI Works

The AI is **Serenity**, a persona built on top of **Gemini 2.5 Flash** with a carefully crafted system prompt that:

- Listens with deep empathy and zero judgment
- Validates feelings and normalises emotional experiences  
- Offers coping strategies: 4-7-8 breathing, 5-4-3-2-1 grounding, CBT thought challenging, journaling
- **Immediately provides crisis resources** (988, 741741, SAMHSA) if suicidal ideation is detected
- Never gives medical diagnoses or comments on medications
- Keeps responses warm, concise (2–4 paragraphs), and conversational

Full conversation history per session is sent to Gemini on each message, giving the AI memory within a session.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python · Flask 3.0 · Flask-CORS |
| AI | Google Gemini 2.5 Flash (`google-genai`) |
| Database | In-memory Python (default) · MongoDB (optional via `pymongo`) |
| Frontend | Vanilla HTML · CSS · JavaScript (no build step) |
| Fonts | Cormorant Garamond · Outfit (Google Fonts) |
| Deployment | Gunicorn · Render.com |

---

## ⚠️ Disclaimer

Serenity AI is **not a substitute for professional mental health care**. If you are experiencing a crisis:

- **Call or text 988** (Suicide and Crisis Lifeline — US, 24/7)
- **Text HOME to 741741** (Crisis Text Line)
- **Call 1-800-662-4357** (SAMHSA National Helpline)

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Made with 💚 — because everyone deserves support.*
