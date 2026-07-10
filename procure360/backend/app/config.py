"""
Central configuration for Procure360.
All env vars and path constants live here — never hardcoded anywhere else.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Search up to the project root for .env
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(env_path)

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent          # app/
DATA_DIR = BASE_DIR / "data"
STORAGE_DIR = BASE_DIR / "storage"
SQLITE_PATH = STORAGE_DIR / "procure360.db"
SAMPLE_BIDS_DIR = DATA_DIR / "sample_bids"
SAMPLE_CONTRACTS_DIR = DATA_DIR / "sample_contracts"
RAW_DIR = DATA_DIR / "raw"
RAW_BIDS_DIR = RAW_DIR / "bids"
RAW_CONTRACTS_DIR = RAW_DIR / "contracts"
RAW_EXTRACTIONS_DIR = RAW_DIR / "extractions"
CLAUSE_TEMPLATES_PATH = DATA_DIR / "standard_clause_templates.json"
MATERIAL_COST_INDEX_PATH = DATA_DIR / "material_cost_index.json"

# ── LLM (Google Gemini) ────────────────────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")  # fast & cheap for hackathon

# ── Upload limits ──────────────────────────────────────────────────────────
MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "20"))
MAX_UPLOAD_SIZE_BYTES: int = MAX_UPLOAD_SIZE_MB * 1024 * 1024

# ── App metadata ───────────────────────────────────────────────────────────
APP_TITLE = "Procure360"
APP_VERSION = "0.1.0"
APP_DESCRIPTION = "AI-powered procurement intelligence — Bid Comparison & Contract Risk Scanner"

# ── CORS ───────────────────────────────────────────────────────────────────
CORS_ORIGINS: list[str] = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")
