class InMemoryDB:
    def __init__(self):
        self.users = []
        self.chat_sessions = []
        self.messages = []
        self.mood_entries = []
        self.journal_entries = []

db = None

def init_db():
    global db
    db = InMemoryDB()
    print("In-Memory DB connected")
    return db

def get_db():
    global db
    if db is None:
        init_db()
    return db
