"""FastAPI application entry point.

Creates the FastAPI app, registers middleware (CORS), includes API
routers, and manages the LLM service lifecycle.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import health, interview
from .config import settings
from .db.database import init_db
from .services.llm_service import llm_service

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler.

    * On startup: initialise the database and log configuration.
    * On shutdown: close the LLM HTTP client.
    """
    # ── Startup ─────────────────────────────────────────────────
    logger.info(
        "Starting %s v%s on %s:%d",
        settings.app_name,
        settings.app_version,
        settings.host,
        settings.port,
    )
    logger.info("LLM gateway: %s", settings.llm_base_url)
    init_db()

    yield

    # ── Shutdown ────────────────────────────────────────────────
    logger.info("Shutting down… closing LLM service client")
    await llm_service.close()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

# ── CORS (allow all origins in dev) ─────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────

app.include_router(health.router)
app.include_router(interview.router)
