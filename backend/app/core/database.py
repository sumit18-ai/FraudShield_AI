"""
Database engine, session factory, and base model for SQLAlchemy.
Uses SQLite by default (DATABASE_URL env var); swap to PostgreSQL with
DATABASE_URL=postgresql+psycopg2://user:pass@host/dbname
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./db/fraudshield.db")

# SQLite needs check_same_thread=False; this kwarg is ignored by other dialects
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency that yields a DB session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Creates all tables if they don't exist. Call once at startup."""
    import os
    # Ensure the db directory exists for SQLite
    if DATABASE_URL.startswith("sqlite"):
        db_path = DATABASE_URL.replace("sqlite:///", "")
        db_dir = os.path.dirname(db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
    Base.metadata.create_all(bind=engine)
