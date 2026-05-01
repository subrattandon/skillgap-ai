"""Database connection and session management.

Uses SQLAlchemy with an async-compatible SQLite engine.  The session
factory is created lazily on first use so that importing this module
does not immediately open a database connection.
"""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from ..config import settings

# SQLite-specific args are only needed for local development
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for ORM models."""


def get_db() -> Session:
    """FastAPI dependency that yields a database session.

    The session is automatically closed after the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables that do not yet exist in the database."""
    Base.metadata.create_all(bind=engine)
