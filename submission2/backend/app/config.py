from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./quickmove.db"
    GEMINI_API_KEY: str = ""
    N8N_WEBHOOK_URL: str = "http://localhost:5678/webhook/broker-assignment"
    DEMO_MODE: bool = False

    # Direct SMTP email (Gmail or any SMTP provider)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""          # e.g. yourname@gmail.com
    SMTP_PASSWORD: str = ""      # 16-char Gmail App Password
    EMAIL_FROM_NAME: str = "QuickMove Operations"

    # CORS — comma-separated list of allowed frontend origins
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    class Config:
        env_file = ".env"


settings = Settings()
