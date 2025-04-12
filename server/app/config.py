from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings"""
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "A-UI"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"  # TODO: Move to env var
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Database
    DATABASE_URL: str = "sqlite:///./app.db"  # TODO: Update for production
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Vector Database
    VECTOR_DB_PATH: str = "./vector_db"
    
    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings() 