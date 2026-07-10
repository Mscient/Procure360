"""
SQLite database connection and initialisation.

Usage:
    from app.storage.db import get_db, init_db

    # In startup lifespan:
    init_db()
    migrate_db()

    # In a route/service:
    with get_db() as db:
        db.execute(...)
"""
import sqlite3
from contextlib import contextmanager
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


def migrate_db() -> None:
    """
    Safe, idempotent migrations for existing databases.

    ALTER TABLE in SQLite has no IF NOT EXISTS / IF EXISTS guard, so we catch
    the OperationalError that fires when a column already exists or a column
    to-be-renamed is absent.  Running this multiple times is harmless.
    """
    db = get_db()
    migrations = [
        # Rename the misnamed column in flags (source_location → reason).
        # SQLite < 3.25 doesn't support RENAME COLUMN, so we add the new
        # column and leave the old one in place for backward compat.
        ("ALTER TABLE flags ADD COLUMN reason TEXT",
         "flags.reason already exists — skipping"),

        # Add raw_text storage to contracts so chat can reference it.
        ("ALTER TABLE contracts ADD COLUMN raw_text TEXT",
         "contracts.raw_text already exists — skipping"),

        # Contract lifecycle: status and expiry date.
        ("ALTER TABLE contracts ADD COLUMN status TEXT DEFAULT 'active'",
         "contracts.status already exists — skipping"),

        ("ALTER TABLE contracts ADD COLUMN expires_at TEXT",
         "contracts.expires_at already exists — skipping"),

        # Raw data tracing
        ("ALTER TABLE bids ADD COLUMN raw_file_path TEXT",
         "bids.raw_file_path already exists — skipping"),
        
        ("ALTER TABLE contracts ADD COLUMN raw_file_path TEXT",
         "contracts.raw_file_path already exists — skipping"),
    ]
    for sql, skip_msg in migrations:
        try:
            db.execute(sql)
            db.commit()
        except Exception:
            print(f"[DB] migrate_db: {skip_msg}")

    print("[DB] Migrations complete.")
