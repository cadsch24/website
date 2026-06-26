from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./leadhive.db"
    
    # Twilio Settings
    TWILIO_ACCOUNT_SID: str = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    TWILIO_AUTH_TOKEN: str = "your_auth_token"
    TWILIO_PHONE_NUMBER: str = "+1234567890"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
