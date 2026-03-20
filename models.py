from datetime import datetime, timedelta
import hashlib
import random
import string
import uuid

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed):
    return hash_password(password) == hashed

def random_color():
    colors = ["#7BAE8E","#8DB4D4","#B8AAD8","#E8B4B4","#FFD166","#4A7A5E","#2E4A62"]
    return random.choice(colors)

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def serialize(doc):
    if doc is None:
        return None
    return dict(doc)

def serialize_list(docs):
    return [serialize(d) for d in docs]

def generate_id():
    return str(uuid.uuid4())

# USER MODEL
def create_user(db, email, password, username=None):
    user = {
        "_id": generate_id(),
        "username": username or email.split("@")[0],
        "email": email,
        "password": hash_password(password),
        "is_anonymous": False,
        "avatar_color": random_color(),
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow()
    }
    db.users.append(user)
    return user

def create_anonymous_user(db):
    username = "anon_" + random_string()
    user = {
        "_id": generate_id(),
        "username": username,
        "email": None,
        "password": hash_password(random_string(16)),
        "is_anonymous": True,
        "avatar_color": random_color(),
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow()
    }
    db.users.append(user)
    return user

def get_user_by_email(db, email):
    for u in db.users:
        if u["email"] == email:
            return serialize(u)
    return None

def get_user_by_id(db, user_id):
    for u in db.users:
        if str(u["_id"]) == str(user_id):
            return serialize(u)
    return None

def update_last_login(db, user_id):
    for u in db.users:
        if str(u["_id"]) == str(user_id):
            u["last_login"] = datetime.utcnow()
            break

# CHAT SESSION MODEL
def create_session(db, user_id):
    s = {
        "_id": generate_id(),
        "user_id": str(user_id),
        "title": "New Conversation",
        "message_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    db.chat_sessions.append(s)
    return s

def get_user_sessions(db, user_id):
    sessions = [s for s in db.chat_sessions if s["user_id"] == str(user_id)]
    sessions.sort(key=lambda x: x["updated_at"], reverse=True)
    return serialize_list(sessions[:20])

def update_session(db, session_id, title=None):
    for s in db.chat_sessions:
        if str(s["_id"]) == str(session_id):
            s["updated_at"] = datetime.utcnow()
            s["message_count"] += 2
            if title:
                s["title"] = title
            break

# MESSAGE MODEL
def save_message(db, session_id, user_id, role, content):
    msg = {
        "_id": generate_id(),
        "session_id": str(session_id),
        "user_id": str(user_id),
        "role": role,
        "content": content,
        "created_at": datetime.utcnow()
    }
    db.messages.append(msg)
    return msg

def get_session_messages(db, session_id):
    msgs = [m for m in db.messages if m["session_id"] == str(session_id)]
    msgs.sort(key=lambda x: x["created_at"])
    return serialize_list(msgs)

def get_session_history_for_gemini(db, session_id):
    msgs = get_session_messages(db, session_id)
    history = []
    for m in msgs:
        role = "model" if m["role"] == "assistant" else "user"
        history.append({"role": role, "parts": [{"text": m["content"]}]})
    return history

# MOOD MODEL
def save_mood_entry(db, user_id, mood, mood_score, note=None, emotions=None):
    entry = {
        "_id": generate_id(),
        "user_id": str(user_id),
        "mood": mood,
        "mood_score": mood_score,
        "note": note or "",
        "emotions": emotions or [],
        "logged_at": datetime.utcnow()
    }
    db.mood_entries.append(entry)
    return entry

def get_user_mood_entries(db, user_id, limit=30):
    entries = [e for e in db.mood_entries if e["user_id"] == str(user_id)]
    entries.sort(key=lambda x: x["logged_at"], reverse=True)
    return serialize_list(entries[:limit])

def get_weekly_mood(db, user_id):
    week_ago = datetime.utcnow() - timedelta(days=7)
    entries = [e for e in db.mood_entries if e["user_id"] == str(user_id) and e["logged_at"] >= week_ago]
    entries.sort(key=lambda x: x["logged_at"])
    return serialize_list(entries)

def get_mood_stats(db, user_id):
    week_ago = datetime.utcnow() - timedelta(days=7)
    entries = [e for e in db.mood_entries if e["user_id"] == str(user_id) and e["logged_at"] >= week_ago]
    if not entries:
        return {"avg_score": 0, "days_logged": 0, "most_common_mood": "None"}
    scores = [e["mood_score"] for e in entries]
    moods = [e["mood"] for e in entries]
    days = set([str(e["logged_at"])[:10] for e in entries])
    return {
        "avg_score": round(sum(scores) / len(scores), 1),
        "days_logged": len(days),
        "most_common_mood": max(set(moods), key=moods.count) if moods else "None"
    }

# JOURNAL MODEL
def save_journal_entry(db, user_id, content, title=None, mood=None):
    entry = {
        "_id": generate_id(),
        "user_id": str(user_id),
        "title": title or "Journal Entry",
        "content": content,
        "mood": mood or "",
        "created_at": datetime.utcnow()
    }
    db.journal_entries.append(entry)
    return entry

def get_user_journal_entries(db, user_id, limit=20):
    entries = [e for e in db.journal_entries if e["user_id"] == str(user_id)]
    entries.sort(key=lambda x: x["created_at"], reverse=True)
    return serialize_list(entries[:limit])
