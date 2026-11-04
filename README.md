# ContextMind AI 🧠

An intelligent, context-aware chatbot powered by **Google Gemini**, built with a **FastAPI** backend and a **React + Tailwind CSS** frontend, featuring persistent conversation memory in **MongoDB Atlas** and secure Google Authentication via **Firebase**.

---

## ✨ Features

- **Context-Aware Memory**: Remembers past turns within a configurable conversation window (`MAX_CONTEXT_MESSAGES`) to provide accurate, context-aware responses.
- **Smart Conversation Naming**: Automatically derives concise, word-boundary conversation titles from your initial prompt instead of displaying raw IDs.
- **Multi-Tenant User Isolation**: Strict ownership enforcement using Firebase ID tokens (`Authorization: Bearer <token>`). Users only see, interact with, and manage their own conversations.
- **Cascade Chat Deletion**: Deleting a conversation permanently wipes the conversation entry and all its associated messages from MongoDB Atlas in a single action.
- **Modern Dark UI**: Clean, responsive interface built with React 19, Tailwind CSS v4, and Lucide icons, including typing indicators, smooth animations, and confirmation dialogs.
- **Interactive Swagger Documentation**: Built-in FastAPI Swagger UI at `/docs` with Bearer token authentication support.

---

## 🏗️ Architecture & Tech Stack

```text
┌─────────────────────────┐          HTTP / JSON          ┌─────────────────────────┐
│     React Frontend      │  ──────────────────────────>  │     FastAPI Backend     │
│   (Vite + Tailwind v4)  │   Authorization: Bearer <JWT> │  (Python 3.10+ / 3.14)  │
└─────────────────────────┘                               └─────────────────────────┘
             │                                                         │
             │                                        ┌────────────────┴────────────────┐
             v                                        v                                 v
   ┌───────────────────┐                    ┌───────────────────┐             ┌───────────────────┐
   │   Firebase Auth   │                    │   Google Gemini   │             │   MongoDB Atlas   │
   │  (Google Sign-In) │                    │   (google-genai)  │             │   (Memory Store)  │
   └───────────────────┘                    └───────────────────┘             └───────────────────┘
```

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Firebase JS SDK.
- **Backend**: FastAPI, Uvicorn, Google GenAI SDK (`google-genai`), PyMongo, `google-auth` (token verification).
- **Database**: MongoDB Atlas (`conversations` and `messages` collections) with compound indexes.
- **AI Model**: Google Gemini (`gemini-3.5-flash-lite`).

---

## 📁 Project Directory Structure

```text
contextmind-ai/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   └── chat.py          # FastAPI chat & conversation route handlers
│   │   ├── auth.py              # Firebase ID token verification dependency
│   │   ├── config.py            # Environment configuration & validation
│   │   ├── database.py          # MongoDB Atlas client connection & certifi SSL
│   │   ├── gemini.py            # Google GenAI SDK integration & persona prompt
│   │   ├── main.py              # FastAPI app definition & CORS configuration
│   │   └── memory.py            # Conversation storage, history retrieval & deletion
│   ├── test_context_window.py   # Test suite for sliding context memory window
│   ├── test_gemini.py           # Verification script for Gemini API connectivity
│   ├── testdb.py                # Database ping & connection verification
│   └── testmemory.py            # Database CRUD test suite
├── frontend/
│   ├── src/
│   │   ├── assets/              # Icons and static image assets
│   │   ├── services/
│   │   │   ├── api.js           # Fetch API client for backend communication
│   │   │   └── auth.js          # Firebase Google login/logout handlers
│   │   ├── App.jsx              # Main chat application component
│   │   ├── firebase.js          # Firebase app & auth initialization
│   │   └── main.jsx             # React DOM entry point
│   ├── .env.example             # Frontend environment variables template
│   ├── package.json
│   └── vite.config.js
├── .env.example                 # Root environment variables template
├── .gitignore                   # Comprehensive Git ignore rules
└── requirements.txt             # Python dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Python 3.10+** (Python 3.14 supported)
- **Node.js 18+** and **npm**
- **Google Gemini API Key**: Obtain from [Google AI Studio](https://aistudio.google.com/).
- **MongoDB Atlas Cluster**: Create a free tier cluster on [MongoDB Cloud](https://cloud.mongodb.com/).
- **Firebase Project**: Create a project in [Firebase Console](https://console.firebase.google.com/) and enable **Authentication -> Google Provider**.

> [!IMPORTANT]
> **MongoDB Atlas Network Access**: Ensure your current public IP (or `0.0.0.0/0` for development) is added to **Security -> Network Access** in your MongoDB Atlas dashboard to prevent TLS handshake errors.

---

### 2. Environment Configuration

#### Root Environment (`contextmind-ai/.env`)
Create a `.env` file in the `contextmind-ai` directory:

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=contextmind_db

# Conversation Memory Window
MAX_CONTEXT_MESSAGES=10

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Frontend Environment (`contextmind-ai/frontend/.env`)
Create a `.env` file in the `contextmind-ai/frontend` directory:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:8000/api
```

---

### 3. Backend Setup

1. **Navigate to the project root and activate virtual environment**:
   ```powershell
   cd task-1\contextmind-ai
   .\venv\Scripts\Activate.ps1
   ```
   *(Or create a new one: `python -m venv venv` and install dependencies: `pip install -r requirements.txt`)*

2. **Verify Database and Gemini Connections**:
   ```powershell
   python backend/testdb.py
   python backend/test_gemini.py
   ```

3. **Start the FastAPI Backend Server**:
   ```powershell
   uvicorn app.main:app --reload --app-dir backend --port 8000
   ```
   *The API will be available at `http://127.0.0.1:8000`. Interactive documentation is available at `http://127.0.0.1:8000/docs`.*

---

### 4. Frontend Setup

1. **Navigate into the frontend directory**:
   ```powershell
   cd frontend
   ```

2. **Install Node dependencies**:
   ```powershell
   npm install
   ```

3. **Start Vite development server**:
   ```powershell
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*

---

## 📡 API Reference

All protected routes require an `Authorization: Bearer <Firebase_ID_Token>` header.

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/` | API health check | No |
| `POST` | `/api/chat` | Send a message; creates or appends to a conversation | **Yes** |
| `GET` | `/api/conversations` | Get all recent conversations for the signed-in user | **Yes** |
| `GET` | `/api/conversations/{id}/messages` | Retrieve all messages from an owned conversation | **Yes** |
| `PATCH`| `/api/conversations/{id}` | Rename an owned conversation title | **Yes** |
| `DELETE`| `/api/conversations/{id}` | Cascade-delete an owned conversation and its messages | **Yes** |

---

## 🧪 Testing

Automated test scripts are included in the `backend/` directory:

```powershell
# Test MongoDB Atlas connection and ping
python backend/testdb.py

# Test Google Gemini generation
python backend/test_gemini.py

# Test conversation CRUD and indexing
python backend/testmemory.py

# Test 10-message sliding window truncation
python backend/test_context_window.py
```

---

## 🛡️ License

This project is created for the internship assessment. All rights reserved.

