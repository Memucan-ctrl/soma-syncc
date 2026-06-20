"""
SomaSync Configuration Module
Loads and validates all environment variables using Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_service_role_key: str = ""

    # Moodle
    moodle_base_url: str = "https://elearning.zetech.ac.ke/webservice/rest/server.php"
    moodle_ws_token: str = ""
    moodle_user_id: int = 42920

    # Gemini AI
    gemini_api_key: str = ""

    # Azure Document Intelligence
    azure_doc_intelligence_endpoint: str = ""
    azure_doc_intelligence_key: str = ""

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    # Server
    port: int = 8000
    environment: str = "development"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
