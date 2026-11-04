from pathlib import Path
from dotenv import load_dotenv
from google import genai
import os

# Load environment variables from contextmind-ai root
BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

# Get API key and model
api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

if not api_key:
    raise ValueError("GEMINI_API_KEY is missing from .env")

# Initialize Gemini client
client = genai.Client(api_key=api_key)

# Send a test message
response = client.models.generate_content(
    model=model_name,
    contents="Hello Gemini! Introduce yourself in two sentences."
)

# Print response
print("Gemini Response:")
print(response.text)
