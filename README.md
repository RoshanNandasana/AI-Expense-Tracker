# 🤖 AI Expense Tracker

A full-stack, AI-powered personal finance application that lets you **track expenses**, **scan receipts with OCR**, and receive **intelligent spending insights** — all in a sleek, modern interface.

---

## ✨ Features

- **🔐 Secure Authentication** — JWT-based login/register with bcrypt password hashing
- **💰 Expense Management** — Full CRUD with search, filtering, pagination, and CSV export
- **📷 Receipt Scanning** — Upload receipt images → EasyOCR text extraction → AI-powered parsing (Gemini)
- **🧠 AI Financial Advisor** — Budget predictions, spending pattern analysis, and personalized saving tips
- **📊 Analytics Dashboard** — Interactive charts (spending trends, category breakdowns, weekly comparisons)
- **💬 AI Chat Advisor** — Conversational financial assistant built into the dashboard
- **📱 Responsive UI** — Premium glassmorphism design with dark mode support

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Recharts, Lucide Icons |
| **Backend** | FastAPI, Python, Uvicorn (ASGI) |
| **Database** | MongoDB Atlas (Motor async driver) |
| **OCR** | EasyOCR (Deep Learning) |
| **AI** | Google Gemini 2.0 Flash (with local heuristic fallback) |
| **Auth** | JWT (python-jose) + bcrypt |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1    # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

Create `backend/.env` from the template:
```bash
cp .env.example .env
# Edit .env with your MongoDB URL, JWT secret, and Gemini API key
```

Start the backend:
```bash
uvicorn app.main:app --reload
```

API docs available at: **http://localhost:8000/docs**

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: **http://localhost:5173**

---

## 📁 Project Structure

```
AI-Expense-Tracker/
├── backend/
│   ├── app/
│   │   ├── ai/              # Gemini AI + heuristic receipt parsing
│   │   ├── auth/             # JWT security & password hashing
│   │   ├── config/           # Pydantic settings (.env loader)
│   │   ├── database/         # MongoDB Motor client & indexes
│   │   ├── middleware/       # Request logging middleware
│   │   ├── models/           # Pydantic DB models
│   │   ├── routes/           # API endpoints (auth, expenses, receipts, analytics)
│   │   ├── schemas/          # Request/Response validation schemas
│   │   ├── services/         # OCR & CSV services
│   │   ├── utils/            # Helpers (date parsing, serialization)
│   │   └── main.py           # FastAPI app entrypoint
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React auth context
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layouts/          # App layout shell
│   │   ├── pages/            # Route pages (Dashboard, Analytics, etc.)
│   │   ├── services/         # API client & mock AI
│   │   └── utils/            # Formatters & helpers
│   ├── package.json
│   └── vite.config.js
└── .gitignore
```

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update profile |
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses` | List expenses (with filters) |
| GET | `/api/expenses/export` | Download CSV export |
| PUT | `/api/expenses/{id}` | Update expense |
| DELETE | `/api/expenses/{id}` | Delete expense |
| POST | `/api/receipts/upload` | Upload & scan receipt |
| GET | `/api/analytics/dashboard` | Full dashboard stats |
| GET | `/api/analytics/budget-prediction` | AI budget forecast |

---

## 📄 License

This project is for educational and personal use.
