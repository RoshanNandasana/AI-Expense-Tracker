import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Expense Tracker API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Server Configuration
    PORT: int = 8000
    HOST: str = "127.0.0.1"

    # Database Configuration
    MONGODB_URL: str = Field(default="mongodb://localhost:27017/expense_tracker")
    DB_NAME: str = "expense_tracker"

    # Security Configuration
    JWT_SECRET_KEY: str = Field(default="94c1e457f5c53151ec501726a31c51016834162e21bb7fb54f15ab9c34f78de2")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours (1440 minutes)

    # AI Configuration — Gemini (optional but recommended for smart receipt parsing)
    GEMINI_API_KEY: str = ""

    # Uploads Configuration
    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Make sure upload directory exists on initialization
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
