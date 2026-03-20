# Serenity — AI Mental Health Companion

## Overview
Serenity is a compassionate AI mental health support web app built with Flask and Google Gemini AI. It provides chat-based emotional support, mood tracking, and journaling features.

## Architecture
- **Backend**: Python/Flask (single `app.py`)
- **Database**: In-memory Python objects (no external DB required; data is reset on restart)
- **AI**: Google Gemini (`gemini-2.5-flash`) via `google-genai` SDK
- **Frontend**: Jinja2 templates served by Flask (`templates/index.html`, `static/`)

## Key Files
- `app.py` — Flask app, all routes and API endpoints
- `database.py` — In-memory DB (`InMemoryDB` class, plain Python lists)
- `models.py` — Data model functions (users, sessions, messages, mood, journal)
- `templates/index.html` — Main HTML template
- `static/style.css`, `static/app.js` — Frontend assets

## Configuration / Environment Variables
- `SECRET_KEY` — Flask session secret (defaults to `serenity-secret-key`)
- `GEMINI_API_KEY` — Google Gemini API key (required for AI chat)
- `MONGO_URI` — Optional MongoDB URI (not currently used; app uses in-memory DB)

## Running the App
The workflow command is: `python app.py`
Flask runs on `0.0.0.0:5000`.

## Deployment
Configured for `vm` target (always-running) since the app uses in-memory state.
Run command: `gunicorn --bind=0.0.0.0:5000 --reuse-port app:app`

## API Endpoints
- `GET /` — Main app page
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login
- `POST /api/auth/anonymous` — Anonymous session
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user
- `POST/GET /api/sessions` — Create/list chat sessions
- `GET /api/sessions/<id>/messages` — Get session messages
- `POST /api/chat` — Send message to Gemini AI
- `POST/GET /api/mood` — Log/get mood entries
- `POST/GET /api/journal` — Save/get journal entries
- `GET /api/health` — Health check
- `GET /api/stats` — Platform statistics
