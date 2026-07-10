"""
Stats Router — GET /stats/summary

Returns a single aggregated snapshot used to populate the KPI stat
cards on the Dashboard: total contracts, high-risk flags, bids processed,
and disputes filed.
"""

from fastapi import APIRouter
from app.storage.db import get_db

router = APIRouter()


@router.get("/summary")
async def get_summary():
    with get_db() as conn:
        total_contracts = conn.execute(
            "SELECT COUNT(*) FROM contracts"
        ).fetchone()[0]

        high_risk_flags = conn.execute(
            "SELECT COUNT(*) FROM flags WHERE severity = 'HIGH'"
        ).fetchone()[0]

        total_flags = conn.execute(
            "SELECT COUNT(*) FROM flags"
        ).fetchone()[0]

        bids_processed = conn.execute(
            "SELECT COUNT(*) FROM bids"
        ).fetchone()[0]

        disputes_filed = conn.execute(
            "SELECT COUNT(*) FROM disputes"
        ).fetchone()[0]

    return {
        "total_contracts": total_contracts,
        "high_risk_flags": high_risk_flags,
        "total_flags": total_flags,
        "bids_processed": bids_processed,
        "disputes_filed": disputes_filed,
    }
