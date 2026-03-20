import urllib.request
import urllib.parse
import json
import ssl

def post_json(url, data=None, cookies=None):
    req = urllib.request.Request(url, method="POST")
    req.add_header("Content-Type", "application/json")
    if cookies:
         req.add_header("Cookie", cookies)
    body = json.dumps(data).encode("utf-8") if data else b""
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        resp = urllib.request.urlopen(req, data=body, context=ctx)
        cookie = resp.headers.get("Set-Cookie", "")
        return json.loads(resp.read().decode("utf-8")), resp.status, cookie
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode("utf-8")), e.code, ""
    except Exception as e:
        print(f"Error: {e}")
        return None, 500, ""

base_url = "http://127.0.0.1:5000/api"

# 1. Auth Anonymous
auth_res, auth_status, auth_cookie = post_json(f"{base_url}/auth/anonymous")
print("Auth:", auth_res, auth_status)

# Extract just the session cookie part
cookie_val = auth_cookie.split(";")[0] if auth_cookie else ""

# 2. Create Session
sess_res, sess_status, _ = post_json(f"{base_url}/sessions", cookies=cookie_val)
print("Session:", sess_res, sess_status)
if sess_status != 200:
    exit(1)
session_id = sess_res["session"]["_id"]

# 3. Chat
chat_res, chat_status, _ = post_json(f"{base_url}/chat", data={"message": "Hello, Serenity! This is a test message.", "session_id": session_id}, cookies=cookie_val)
print("Chat Response:", chat_status)
print("Reply:", chat_res.get("reply", chat_res))
