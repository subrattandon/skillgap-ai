"""Application configuration using pydantic-settings.

Reads configuration from environment variables and the z-ai-config file
used by the z-ai-web-dev-sdk so the FastAPI backend can call the
LLM gateway directly over HTTP (same as the Node.js SDK does).
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


def _load_z_ai_config() -> dict:
    """Load the z-ai-sdk configuration file.

    Mirrors the priority used by the Node.js SDK:
      1. ``<cwd>/.z-ai-config``
      2. ``<homedir>/.z-ai-config``
      3. ``/etc/.z-ai-config``
    """
    search_paths = [
        Path(os.getcwd()) / ".z-ai-config",
        Path.home() / ".z-ai-config",
        Path("/etc/.z-ai-config"),
    ]
    for path in search_paths:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if data.get("baseUrl") and data.get("apiKey"):
                return data
        except (OSError, json.JSONDecodeError, KeyError):
            continue
    return {}


_z_ai_config = _load_z_ai_config()


class Settings(BaseSettings):
    """Central application settings.

    Values are resolved in this order:
      1. Explicit environment variable
      2. Value from ``.z-ai-config`` (for LLM-related fields)
      3. Default
    """

    # ── Application ──────────────────────────────────────────────
    app_name: str = "SkillGap AI Backend"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, alias="DEBUG")

    # ── Server ───────────────────────────────────────────────────
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")

    # ── CORS ─────────────────────────────────────────────────────
    cors_origins: list[str] = Field(
        default=["*"],
        alias="CORS_ORIGINS",
    )

    # ── LLM Gateway (z-ai) ──────────────────────────────────────
    llm_base_url: str = Field(
        default=_z_ai_config.get("baseUrl", "http://localhost:8080/v1"),
        alias="LLM_BASE_URL",
    )
    llm_api_key: str = Field(
        default=_z_ai_config.get("apiKey", ""),
        alias="LLM_API_KEY",
    )
    llm_chat_id: Optional[str] = Field(
        default=_z_ai_config.get("chatId"),
        alias="LLM_CHAT_ID",
    )
    llm_user_id: Optional[str] = Field(
        default=_z_ai_config.get("userId"),
        alias="LLM_USER_ID",
    )
    llm_token: Optional[str] = Field(
        default=_z_ai_config.get("token"),
        alias="LLM_TOKEN",
    )

    # ── Database ─────────────────────────────────────────────────
    # Use BACKEND_DATABASE_URL to avoid clashing with the Prisma
    # DATABASE_URL that already exists in the project root .env.
    _db_default = f"sqlite:///{Path(__file__).resolve().parent.parent / 'interview.db'}"
    database_url: str = Field(
        default=_db_default,
        alias="BACKEND_DATABASE_URL",
    )

    model_config = {
        # Point to the backend-specific .env so we don't pick up
        # the root project's DATABASE_URL (which is a Prisma URL).
        "env_file": str(Path(__file__).resolve().parent.parent / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "populate_by_name": True,
    }


settings = Settings()
