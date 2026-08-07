from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

LOCAL_DATABASE=(Path(__file__).resolve().parents[3]/"data"/"nivaran.db").as_posix()

class Settings(BaseSettings):
    database_url: str = f"sqlite:///{LOCAL_DATABASE}"
    jwt_secret: str = Field(default="development-only-change-me-development",min_length=32)
    openai_api_key: str | None = None
    openai_text_model: str = "gpt-5.4-nano"
    openai_transcription_model: str = "gpt-4o-mini-transcribe"
    openai_embedding_model: str = "text-embedding-3-small"
    web_origin: str = "http://localhost:3000"
    upload_dir: str = "../../data/uploads"
    cookie_secure: bool = False
    model_config = SettingsConfigDict(env_file=(".env", "../../.env"), extra="ignore")

settings = Settings()
