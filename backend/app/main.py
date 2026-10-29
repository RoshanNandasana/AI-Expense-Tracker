import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from app.config.settings import settings
from app.database.connection import connect_to_mongo, close_mongo_connection
from app.middleware.logging import LoggingMiddleware
from app.routes import auth, users, expenses, receipts, analytics

# Configure root logger format and level
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("app.main")

# Lifespan context manager (replaces deprecated on_event)
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing application startup sequence...")
    await connect_to_mongo()
    yield
    logger.info("Initializing application shutdown sequence...")
    await close_mongo_connection()

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-ready FastAPI backend for the AI Expense Tracker. Features receipt OCR, analytics pipelines, and AI budgeting integrations.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 1. Setup CORS Middleware
# Allows seamless communication with modern React/Vite development frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Add Logger Request Middleware
app.add_middleware(LoggingMiddleware)

# 3. Serve Saved Receipt Images (Static Files)
# Allows the frontend to request stored receipts, e.g., http://localhost:8000/uploads/uuid.png
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# 4. Wire Up Core Sub-Routers under prefix /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(expenses.router, prefix=settings.API_V1_STR)
app.include_router(receipts.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

# 6. Root route redirecting directly to API Swagger docs for easy developer exploration
@app.get("/", include_in_schema=False)
async def redirect_to_docs():
    return RedirectResponse(url="/docs")
