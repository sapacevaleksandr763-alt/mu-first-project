import os
import sys
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"

if not TELEGRAM_BOT_TOKEN or not GROQ_API_KEY:
    print("❌ Ошибка: заполни TELEGRAM_BOT_TOKEN и GROQ_API_KEY в файле .env")
    sys.exit(1)
