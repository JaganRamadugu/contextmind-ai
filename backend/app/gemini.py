from google import genai
from google.genai import types

from app.config import GEMINI_API_KEY, GEMINI_MODEL


# Initialize Gemini client
client = genai.Client(
    api_key=GEMINI_API_KEY
)


# Define chatbot personality
SYSTEM_PROMPT = """
You are ContextMind AI, an intelligent and friendly AI assistant.

Your responsibilities:
1. Answer questions accurately and clearly.
2. Maintain context throughout the conversation.
3. Remember information provided in previous messages.
4. Explain technical concepts in simple language.
5. If you don't know something, admit it rather than inventing information.

Be helpful, conversational, and professional.
"""
def generate_response(history: list) -> str:
    gemini_history = []

    for message in history:
        gemini_history.append({
            "role": message["role"],
            "parts": [{"text": message["content"]}]
        })

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=gemini_history,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.7
        )
    )

    if not response.text:
        raise ValueError("Gemini returned an empty response")

    return response.text
