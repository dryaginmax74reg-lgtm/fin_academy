#!/usr/bin/env python3
"""Print recent private-chat IDs returned by Telegram getUpdates. Never prints token."""
import json, os, urllib.request

token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
if not token:
    raise SystemExit("Add TELEGRAM_BOT_TOKEN secret first")
url = f"https://api.telegram.org/bot{token}/getUpdates?limit=100&allowed_updates=%5B%22message%22%5D"
with urllib.request.urlopen(url, timeout=20) as r:
    data = json.loads(r.read().decode())
if not data.get("ok"):
    raise SystemExit("Telegram getUpdates failed")
seen = set()
for update in data.get("result", []):
    msg = update.get("message", {})
    chat = msg.get("chat", {})
    if chat.get("type") == "private" and chat.get("id") not in seen:
        seen.add(chat.get("id"))
        user = chat.get("username") or chat.get("first_name") or "private chat"
        print(f"chat_id={chat.get('id')} | user={user} | last_message={msg.get('text','')[:60]!r}")
if not seen:
    print("No private chats found. Open your bot, press Start, send /start, then rerun this workflow.")
