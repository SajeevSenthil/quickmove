from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./quickmove.db"
    GEMINI_API_KEY: str = ""
    N8N_WEBHOOK_URL: str = "http://localhost:5678/webhook/broker-assignment"
    DEMO_MODE: bool = False

    # Resend (HTTPS-based email — works on Render free tier)
    # Sign up free at resend.com → API Keys → Create Key
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "QuickMove Operations <onboarding@resend.dev>"

    # Legacy SMTP (only works when not on Render free)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # CORS — comma-separated list of allowed frontend origins
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    class Config:
        env_file = ".env"


settings = Settings()
