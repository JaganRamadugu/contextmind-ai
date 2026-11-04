import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.chat import router as chat_router

# Create FastAPI application
app = FastAPI(
    title="ContextMind AI",
    description="A context-aware AI chatbot powered by Gemini",
    version="1.0.0"
)

# Base allowed origins for local development
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

# Allow custom production URLs via FRONTEND_URL env var (comma-separated if multiple)
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.extend([url.strip() for url in frontend_url.split(",") if url.strip()])

# Allow React frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.web\.app|https://.*\.firebaseapp\.com|https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register chat routes
app.include_router(
    chat_router,
    prefix="/api",
    tags=["Chat"]
)


@app.get("/")
def home():
    return {
        "message": "Welcome to ContextMind AI API!",
        "status": "running"
    }
