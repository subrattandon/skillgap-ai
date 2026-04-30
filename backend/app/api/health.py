"""Health check endpoint.

Provides a simple ``GET /api/health`` route that returns the
application status, version, and LLM gateway connectivity info.
"""

from __future__ import annotations

from fastapi import APIRouter

from ..config import settings

router = APIRouter(tags=["health"])


@router.get("/api/health")
async def health_check() -> dict:
    """Return application health and configuration metadata."""
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "llm_base_url": settings.llm_base_url,
    }
