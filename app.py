from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from database import init_db, get_db
from models import (
    create_user, create_anonymous_user, get_user_by_email,
    get_user_by_id, update_last_login, verify_password,
    create_session, get_user_sessions, get_session_history_for_gemini,
    update_session, save_message, get_session_messages,
    save_mood_entry, get_user_mood_entries, get_weekly_mood, get_mood_stats,
    save_journal_entry, get_user_journal_entries
)

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "serenity-secret-key")
CORS(app)
try:
    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
except Exception:
    gemini_client = None

SYSTEM_PROMPT = """You are Serenity, a compassionate AI mental health support companion.
- Listen with deep empathy and zero judgment
- Validate feelings and normalize emotional experiences
- Offer gentle coping strategies: breathing exercises, grounding (5-4-3-2-1 method), journaling prompts, CBT thought challenging
- Use warm conversational language, never clinical or robotic
- Use emojis sparingly for warmth: 💚 🌿 💙 🌸 🌙
- Keep responses to 2-4 short paragraphs with line breaks between them
- Remind users you are an AI when relevant
- CRITICAL: If someone expresses suicidal thoughts or crisis immediately provide:
  988 Suicide and Crisis Lifeline (call or text 988)
  Crisis Text Line (text HOME to 741741)
  SAMHSA Helpline (1-800-662-4357)
- Never give medical diagnoses
- Never comment on medications
- Focus on: active listening, emotional validation, breathing, mindfulness, grounding, CBT, self-compassion
- Speak like a trusted warm friend with wellness knowledge"""

with app.app_context():
    init_db()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/auth/register", methods=["POST"])
def signup():
    try:
        data = request.get_json()
        email = data.get("email","").strip()
        password = data.get("password","").strip()
        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400
        db = get_db()
        if get_user_by_email(db, email):
            return jsonify({"error": "Email already registered"}), 409
        user = create_user(db, email, password)
        session["user_id"] = user["_id"]
        session["username"] = user["username"]
        return jsonify({"message": "Account created", "user": {"id": user["_id"], "username": user["username"]}})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email","").strip()
        password = data.get("password","").strip()
        db = get_db()
        user = get_user_by_email(db, email)
        if not user or not verify_password(password, user["password"]):
            return jsonify({"error": "Invalid email or password"}), 401
        update_last_login(db, user["_id"])
        session["user_id"] = user["_id"]
        session["username"] = user["username"]
        return jsonify({"message": "Logged in", "user": {"id": user["_id"], "username": user["username"]}})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/anonymous", methods=["POST"])
def anonymous():
    try:
        db = get_db()
        user = create_anonymous_user(db)
        session["user_id"] = user["_id"]
        session["username"] = user["username"]
        return jsonify({"message": "Anonymous session created", "user": {"id": user["_id"], "username": user["username"]}})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})

@app.route("/api/auth/me", methods=["GET"])
def me():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401
    return jsonify({"user_id": session["user_id"], "username": session["username"]})

@app.route("/api/sessions", methods=["POST"])
def new_session():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401
    try:
        db = get_db()
        chat_session = create_session(db, session["user_id"])
        return jsonify({"session": chat_session})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/sessions", methods=["GET"])
def list_sessions():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401
    try:
        db = get_db()
        sessions = get_user_sessions(db, session["user_id"])
        return jsonify({"sessions": sessions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/sessions/<session_id>/messages", methods=["GET"])
def get_messages(session_id):
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401
    try:
        db = get_db()
        messages = get_session_messages(db, session_id)
        return jsonify({"messages": messages})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/chat", methods=["POST"])
def chat():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401
    try:
        data = request.get_json()
        user_message = data.get("message","").strip()
        session_id = data.get("session_id")
        if not user_message or not session_id:
            return jsonify({"error": "Message and session_id required"}), 400
        db = get_db()
        save_message(db, session_id, session["user_id"], "user", user_message)
        history = get_session_history_for_gemini(db, session_id)
        if not gemini_client:
            return jsonify({"error": "Gemini API client not initialized. Please ensure GEMINI_API_KEY is set."}), 500
            
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=history,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                max_output_tokens=600,
                temperature=0.7
            )
        )
        reply = response.text
        save_message(db, session_id, session["user_id"], "assistant", reply)
        all_msgs = get_session_messages(db, session_id)
        if len(all_msgs) == 2:
            title = user_message[:40] + ("..." if len(user_message) > 40 else "")
            update_session(db, session_id, title=title)
        else:
            update_session(db, session_id)
        return jsonify({"reply": reply})
    except Exception as e:
        import traceback; traceback.print_exc()
        error_msg = str(e)
        if "401" in error_msg or "API_KEY" in error_msg.upper():
            return jsonify({"error": "Invalid API key"}), 401
        elif "429" in error_msg or "quota" in error_msg.lower():
            return jsonify({"error": "Rate limit reached"}), 429
        return jsonify({"error": error_msg}), 500

@app.route("/api/mood", methods=["POST"])
def log_mood():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401
    try:
        data = request.get_json()
        mood = data.get("mood","").strip()
        mood_score = data.get("mood_score", 3)
        note = data.get("note","")
        emotions = data.get("emotions",[])
        if not mood:
            return jsonify({"error": "Mood required"}), 400
        db = get_db()
        entry = save_mood_entry(db, session["user_id"], mood, mood_score, note, emotions)
        return jsonify({"message": "Mood logged", "entry": entry})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/mood", methods=["GET"])
def get_moods():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401
    try:
        db = get_db()
        entries = get_user_mood_entries(db, session["user_id"])
        weekly = get_weekly_mood(db, session["user_id"])
        stats = get_mood_stats(db, session["user_id"])
        return jsonify({"entries": entries, "weekly": weekly, "stats": stats})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/journal", methods=["POST"])
def save_journal():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401
    try:
        data = request.get_json()
        content = data.get("content","").strip()
        title = data.get("title","")
        mood = data.get("mood","")
        if not content:
            return jsonify({"error": "Content required"}), 400
        db = get_db()
        entry = save_journal_entry(db, session["user_id"], content, title, mood)
        return jsonify({"message": "Journal saved", "entry": entry})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/journal", methods=["GET"])
def get_journal():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401
    try:
        db = get_db()
        entries = get_user_journal_entries(db, session["user_id"])
        return jsonify({"entries": entries})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "api_key_set": bool(os.getenv("GEMINI_API_KEY")), "mongo_uri_set": bool(os.getenv("MONGO_URI"))})

@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Get platform statistics"""
    try:
        db = get_db()
        
        # Count total users
        total_users = db.users.count_documents({})
        
        # Count total sessions
        total_sessions = db.sessions.count_documents({})
        
        # Count total messages
        total_messages = db.sessions.aggregate([
            {"$project": {"message_count": {"$size": "$messages"}}}
        ])
        message_count = sum([s.get("message_count", 0) for s in total_messages])
        
        # Count total mood entries
        total_moods = db.mood_entries.count_documents({})
        
        # Get mood distribution
        mood_pipeline = [
            {"$group": {"_id": "$mood", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        mood_dist = list(db.mood_entries.aggregate(mood_pipeline))
        
        # Active users (logged in last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        active_users = db.users.count_documents({"last_login": {"$gte": week_ago}})
        
        return jsonify({
            "total_users": total_users,
            "total_sessions": total_sessions,
            "total_messages": message_count,
            "total_moods": total_moods,
            "active_users": active_users,
            "mood_distribution": mood_dist
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
