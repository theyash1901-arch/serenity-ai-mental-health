# 🚀 MindSpace - Quick Setup Guide

## Prerequisites
- Python 3.8+
- MongoDB (local or Atlas)
- Gemini API Key

## 1️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

## 2️⃣ Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/mindspace
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mindspace

# Gemini API Key (Get from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Flask Secret Key (any random string)
SECRET_KEY=your-secret-key-here-change-this
```

## 3️⃣ Get Your Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Paste it in your `.env` file

## 4️⃣ Start MongoDB

### Option A: Local MongoDB
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Add to `.env` as `MONGO_URI`

## 5️⃣ Run the Application

```bash
python app.py
```

The app will start on `http://localhost:5000`

## 6️⃣ Test the Setup

1. Open browser to `http://localhost:5000`
2. Click "Get Started"
3. Choose "Anonymous" mode
4. Try sending a message in chat
5. If you see a response, it's working! 🎉

## 🐛 Troubleshooting

### Chat not working?
- Check your `GEMINI_API_KEY` in `.env`
- Make sure MongoDB is running
- Check console for errors

### MongoDB connection error?
```bash
# Check if MongoDB is running
mongosh
# or
mongo
```

### API Key error?
- Verify key at https://aistudio.google.com/app/apikey
- Make sure there are no extra spaces in `.env`
- Restart the Flask app after changing `.env`

### Port 5000 already in use?
```bash
# Change port in app.py:
app.run(debug=True, port=5001)
```

## 📊 Verify Everything Works

### Test Checklist:
- [ ] Home page loads
- [ ] Statistics show (may be 0 initially)
- [ ] Can sign up / login
- [ ] Can use anonymous mode
- [ ] Chat sends and receives messages
- [ ] Can log mood
- [ ] Resources page loads
- [ ] Interactive tools work (breathing, journal)

## 🎯 For Presentation

1. **Clear existing data** (optional):
```bash
mongosh
use mindspace
db.dropDatabase()
```

2. **Create test data**:
- Sign up with test account
- Send a few chat messages
- Log some moods
- This will populate the statistics

3. **Open in incognito** for clean demo

## 🔑 Important Notes

- **Gemini API** is free with rate limits
- **MongoDB** local is free, Atlas has free tier
- **No credit card** required for either
- **Data is stored locally** in MongoDB

## 📞 Need Help?

Common issues:
1. **"API key not set"** → Check `.env` file
2. **"Connection refused"** → Start MongoDB
3. **"Module not found"** → Run `pip install -r requirements.txt`
4. **"Port in use"** → Change port or kill process

## ✅ You're Ready!

Once you see:
```
* Running on http://127.0.0.1:5000
```

You're good to go! Open the URL and start testing.

---

**Time to setup: ~5 minutes**
**Time to present: ~5 minutes**
**Time to win: Priceless! 🏆**
