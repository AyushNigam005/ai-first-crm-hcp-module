"""Application configuration loaded from environment variables."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./hcp_crm.db"

    jwt_secret_key: str = "dev-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    groq_api_key: str = ""
    groq_model: str = "gemma2-9b-it"
    groq_fallback_model: str = "llama-3.3-70b-versatile"

    environment: str = "development"
    cors_origins: str = "http://localhost:5173"


settings = Settings()
