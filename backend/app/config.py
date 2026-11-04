from pathlib import Path
from dotenv import load_dotenv
import os

# Find project root (task-1/contextmind-ai)
BASE_DIR = Path(__file__).resolve().parents[2]

# Load environment variables
load_dotenv(BASE_DIR / ".env")

# Gemini configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

# MongoDB configuration
MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "contextmind_db")

# Firebase configuration
FIREBASE_PROJECT_ID = os.getenv("VITE_FIREBASE_PROJECT_ID") or os.getenv("FIREBASE_PROJECT_ID", "contextmind-ai-15ced")

# Context window configuration
MAX_CONTEXT_MESSAGES = int(os.getenv("MAX_CONTEXT_MESSAGES", "10"))

# Validate required variables
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env!")

if not MONGODB_URI:
    raise ValueError("MONGODB_URI not found in .env!")
