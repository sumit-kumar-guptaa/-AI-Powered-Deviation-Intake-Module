from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "AIVOA Deviation Management"
    API_V1_STR: str = "/api/v1"
    
    # Use SQLite for development, PostgreSQL for production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./deviation_dev.db")
    
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()