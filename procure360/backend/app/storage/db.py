"""
SQLite database connection and initialisation.

Usage:
    from app.storage.db import get_db, init_db

    # In startup lifespan:
    init_db()

    # In a route/service:
    db = get_db()
    db.execute(...)
"""
import sqlite3
from pathlib import Path
from app.config import SQLITE_PATH, STORAGE_DIR

_SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def _connect() -> sqlite3.Connection:
    """Open a connection with row_factory so rows behave like dicts."""
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(SQLITE_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")   # safer for concurrent reads
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


# Module-level singleton connection (fine for a single-process hackathon server)
_conn: sqlite3.Connection | None = None


def get_db() -> sqlite3.Connection:
    """Return the shared database connection, creating it if needed."""
    global _conn
    if _conn is None:
        _conn = _connect()
    return _conn


def init_db() -> None:
    """Create all tables from schema.sql if they don't exist yet."""
    db = get_db()
    schema_sql = _SCHEMA_PATH.read_text(encoding="utf-8")
    db.executescript(schema_sql)
    db.commit()
    print(f"[DB] Initialised -> {SQLITE_PATH}")
