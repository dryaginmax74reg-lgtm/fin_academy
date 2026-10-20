#!/usr/bin/env python3
"""Send a curated daily lesson to one Telegram chat using only stdlib."""
import datetime as dt
import html
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS_PATH = ROOT / "course" / "lessons.json"
PROGRAM_PATH = ROOT / "course" / "roadmap.json"


def api(method: str, payload: dict):
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        raise SystemExit("Missing TELEGRAM_BOT_TOKEN GitHub secret")
    url = f"https://api.telegram.org/bot{token}/{method}"
    data = urllib.parse.urlencode(payload).encode()
    req = urllib.request.Request(url, data=data)
    with urllib.request.urlopen(req, timeout=25) as response:
        result = json.loads(response.read().decode())
    if not result.get("ok"):
        raise RuntimeError(f"Telegram API error: {result}")
    return result["result"]


def load():
    lessons = json.loads(LESSONS_PATH.read_text(encoding="utf-8"))
    roadmap = json.loads(PROGRAM_PATH.read_text(encoding="utf-8"))
    return lessons, roadmap


def choose_lesson(lessons, roadmap):
    requested = os.environ.get("LESSON_ID", "").strip()
    if requested:
        for lesson in lessons:
            if lesson["id"].lower() == requested.lower():
                return lesson
        raise SystemExit(f"Unknown LESSON_ID: {requested}")
    # Course start: 2026-10-21; then daily sequence. After the written starter lessons,
    # send the matching roadmap topic as a guided assignment instead of inventing article text.
    start = dt.date(2026, 10, 21)
    today = dt.datetime.now(dt.timezone.utc).date()
    offset = max(0, (today - start).days)
    if offset < len(lessons):
        return lessons[offset]
    items = roadmap["daily_sequence"]
    topic = items[(offset - len(lessons)) % len(items)]
    return {
        "id": f"PLAN-{offset+1:03d}", "title": topic["title"], "month": topic["month"],
        "minutes": 25, "hook": topic["hook"],
        "body": "Сегодня — учебный спринт по теме дорожной карты. Откройте Mini App, найдите этот раздел и выполните план занятия. Это тема программы, а не полностью написанная статья; добавляйте подробный материал в course/lessons.json по мере прохождения.",
        "formula": topic.get("formula", "Сформулируйте механизм и выпишите ключевое уравнение/показатель."),
        "case": topic.get("case", "Найдите исторический кейс и сопоставьте его с текущими условиями."),
        "advisor_application": "Запишите, что это меняет в анализе активов и какие вопросы стоит задать клиенту.",
        "quiz": [], "sources": topic.get("sources", [])
    }


def format_lesson(x):
    e = html.escape
    lines = [f"<b>FINLAB · УРОК {e(x['id'])}</b>", f"<b>{e(x['title'])}</b>",
             f"⏱ {int(x.get('minutes', 25))} минут · Модуль {e(str(x.get('month', '—')))}", "",
             f"<b>Зацепка</b>\n{e(x.get('hook', ''))}", "",
             f"<b>Материал</b>\n{e(x.get('body', ''))}"]
    for label, key in [("Формула / расчёт", "formula"), ("Кейс", "case"), ("Практика советника", "advisor_application")]:
        if x.get(key): lines += ["", f"<b>{label}</b>\n{e(x[key])}"]
    quiz = x.get("quiz", [])
    if quiz:
        lines += ["", "<b>Контрольные вопросы — ответьте себе или откройте Mini App</b>"]
        for i, q in enumerate(quiz[:3], 1):
            lines.append(f"{i}. {e(q['q'])}")
        lines.append("\nОтветы и разбор доступны после выбора в Mini App — сначала попробуйте решить самостоятельно.")
    sources = x.get("sources", [])
    if sources:
        lines += ["", "<b>Источники</b>"]
        for s in sources[:3]:
            if isinstance(s, dict): lines.append(f"• <a href=\"{e(s['url'])}\">{e(s['name'])}</a>")
            else: lines.append(f"• {e(str(s))}")
    lines += ["", "📚 Полный курс и тесты: откройте Mini App в меню бота."]
    return "\n".join(lines)


def main():
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not chat_id:
        raise SystemExit("Missing TELEGRAM_CHAT_ID GitHub secret")
    lessons, roadmap = load()
    lesson = choose_lesson(lessons, roadmap)
    message = format_lesson(lesson)
    # Telegram sendMessage limit is 4096 chars; long lesson is split on paragraph boundaries.
    chunks = []
    while len(message) > 3900:
        cut = message.rfind("\n\n", 0, 3900)
        if cut < 1000: cut = 3900
        chunks.append(message[:cut])
        message = message[cut:].lstrip()
    chunks.append(message)
    mini_url = os.environ.get("MINI_APP_URL", "").strip()
    for index, chunk in enumerate(chunks):
        payload = {"chat_id": chat_id, "text": chunk, "parse_mode": "HTML", "disable_web_page_preview": "true"}
        if mini_url and index == len(chunks) - 1:
            payload["reply_markup"] = json.dumps({"inline_keyboard": [[{"text": "Открыть FINLAB · уроки и тесты", "web_app": {"url": mini_url}}]]}, ensure_ascii=False)
        api("sendMessage", payload)
    print(f"Sent {lesson['id']}: {lesson['title']}")

if __name__ == "__main__":
    main()
