# AI Expense Tracker Backend

A complete, production-ready, highly modular backend for the **AI Expense Tracker** built using **FastAPI** and **MongoDB Atlas** (cloud database). Integrates automated image/PDF receipt scanning with **EasyOCR** and structural parsing + budget insights using generative AI (**OpenAI / Gemini**).

---

## 🚀 Key Features

1. **Authentication System**: Secure registration & login endpoints using JWT bearer authorization and `bcrypt` password hashing.
2. **Expense Management**: Full CRUD operations with support for pagination, sorting, category filtering, chronological date boundaries, and regex full-text searches.
3. **Receipt Upload & OCR**: Scalable Upload system (validates files up to 5MB, JPG/PNG/PDF), extracts text via **EasyOCR** with lazy loading, parses key transaction data (Merchant, Amount, Date, Category) via LLMs, and auto-records transactions.
4. **AI Spend Assistant**: Dynamically matches available cloud API keys (`GEMINI_API_KEY` or `OPENAI_API_KEY`) to run budget pacing predictions and compile bulleted actionable financial recommendations.
5. **Analytics & Aggregations**: Highly optimized MongoDB pipeline queries compiling monthly summary rates, categorical allocations, chronological spending sparklines, and unified dashboard panels.
6. **Streaming CSV Export**: In-memory CSV compilation and streaming downloads for quick data portability.
7. **Developer Friendly**: 100% type-annotated, structured response validations using Pydantic, automated CORS setups, and custom trace logging middleware.

---

## 🛠️ Tech Stack

* **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous Python Framework)
* **Web Server**: [Uvicorn](https://www.uvicorn.org/) (High-performance ASGI server)
* **Database Driver**: [Motor](https://motor.readthedocs.io/) (Asynchronous MongoDB Python driver)
* **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/)
* **Text Extraction (OCR)**: [EasyOCR](https://github.com/JaidedAI/EasyOCR) (Deep learning based OCR)
* **Generative AI**: [Google Generative AI](https://github.com/google/generative-ai-python) & [OpenAI](https://github.com/openai/openai-python)
* **Security**: `python-jose` (JWT), `passlib[bcrypt]` (Password hashing)

---

## 📁 Directory Structure

```
backend/
 ├── app/
 │   ├── main.py                # Server entrypoint & configuration wiring
 │   ├── config/
 │   │   └── settings.py         # Config loader utilizing Pydantic settings (.env)
 │   ├── database/
 │   │   └── connection.py       # Async Motor DB client & automated Index setup
 │   ├── models/
 │   │   ├── user.py             # User DB model
 │   │   ├── expense.py          # Expense DB model
 │   │   └── receipt.py          # Receipt DB model
 │   ├── schemas/
 │   │   ├── auth.py             # Login & Token validation schemas
 │   │   ├── user.py             # Register & Update validation schemas
 │   │   ├── expense.py          # Create, Update, Pagination response schemas
 │   │   ├── receipt.py          # Upload and AI parsing schemas
 │   │   └── analytics.py        # Dashboard stats and charts schemas
 │   ├── routes/
 │   │   ├── auth.py             # Auth endpoints (Register / Login)
 │   │   ├── users.py            # Profile endpoints (Me / Settings)
 │   │   ├── expenses.py         # Expense endpoints (CRUD / Search / CSV Export)
 │   │   ├── receipts.py         # Upload endpoints (Scanning / AI Auto-fill)
 │   │   └── analytics.py        # Statistics endpoints (Weekly / Trends / Predictions)
 │   ├── services/
 │   │   ├── ocr_service.py      # EasyOCR scanner with robust simulated fallbacks
 │   │   └── csv_service.py      # Streamed in-memory CSV compiler
 │   ├── ai/
 │   │   └── ai_service.py       # Dual LLM connector & rule-based analytics engine
 │   ├── utils/
 │   │   └── helpers.py          # Date parsing, value cleaning, and ObjectId serializations
 │   └── middleware/
 │       └── logging.py          # Request execution times and log tracing middleware
 ├── uploads/                    # Local receipt image repository (auto-created)
 ├── requirements.txt            # Package dependencies
 ├── .env.example                # Schema template of configuration variables
 └── .env                        # Local active environment variables
```

---

## ⚡ Quickstart Setup

### 1. Create a Python Virtual Environment
Navigate to the `/backend` folder and run:
```bash
python -m venv venv
```

### 2. Activate the Virtual Environment
* **Windows (PowerShell)**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
* **macOS / Linux**:
  ```bash
  source venv/bin/activate
  ```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```
> **Note on EasyOCR**: Installs `torch` and `easyocr`. When processing your first receipt image, EasyOCR automatically downloads small model files (~90MB). The backend is built defensively; if torch/easyocr installs fail locally, it runs a simulated fallback mock to prevent system crashes.

### 4. Create and Edit `.env` File
Create a `.env` file in the `/backend` directory (you can copy `.env.example`):
```env
# Server
PORT=8000
HOST=127.0.0.1

# Database (Replace with your Atlas string)
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/expense_tracker?retryWrites=true&w=majority

# Security
JWT_SECRET_KEY=94c1e457f5c53151ec501726a31c51016834162e21bb7fb54f15ab9c34f78de2
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# LLM Integrations (Provide at least one)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=
```

### 5. Run the Application
```bash
uvicorn app.main:app --reload
```

---

## 🔗 Key API Routes Summary

Open your browser at **`http://127.0.0.1:8000/docs`** to explore the fully interactive Swagger documentation UI.

### 🔑 Authentication (`/api/auth`)
* `POST /auth/register` - Create user profile and get JWT.
* `POST /auth/login` - Verify credentials and fetch token.

### 👤 Profile (`/api/users`)
* `GET /users/me` - Fetch details of current logged-in user.
* `PUT /users/me` - Update active profile info (name, email, password).

### 💵 Expenses (`/api/expenses`)
* `POST /expenses` - Record a transaction manually.
* `GET /expenses` - View paginated list with category, dates, and full-text filters.
* `GET /expenses/export` - Streams an attachment CSV of all transactions.
* `GET /expenses/{id}` - Details of one expense.
* `PUT /expenses/{id}` - Update expense specifics.
* `DELETE /expenses/{id}` - Delete expense (cleans up associated receipts automatically).

### 📷 Receipts (`/api/receipts`)
* `POST /receipts/upload` - Upload image/PDF receipt. Runs OCR + AI parsing to auto-record expenses.

### 📊 Analytics (`/api/analytics`)
* `GET /analytics/summary` - Current month total spend and remaining budget.
* `GET /analytics/category` - Spent totals and percentages per category.
* `GET /analytics/weekly` - Weekly totals over the last 8 weeks.
* `GET /analytics/trends` - Daily transaction sparkline values for the last 30 days.
* `GET /analytics/budget-prediction` - AI forecast of monthly budget pacing.
* `GET /analytics/dashboard` - Consolidates bird's-eye view analytics panels.
