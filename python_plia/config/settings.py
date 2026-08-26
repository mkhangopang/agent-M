"""
Configuration management for PLIA
"""

import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "qwen3:8b")
    db_path: str = os.getenv("PLIA_DATABASE", "plia.db")
    mock_llm: bool = os.getenv("PLIA_MOCK_LLM", "false").lower() == "true"

settings = Settings()
