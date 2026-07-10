"""
Vendors Router — /vendors

Provides vendor profile views built from bid history.
Every vendor is auto-discovered from the bids table — no manual registration needed.
"""

from fastapi import APIRouter, HTTPException
from app.storage.db import get_db

router = APIRouter()


@router.get("/")
async def list_vendors():
    """
    List all unique vendors with aggregate stats derived from bid history.
    Returns: vendor_name, times_bid, best_score (or null), last_seen
    """
    with get_db() as conn:
        rows = conn.execute("""
            SELECT
                b.vendor_name,
                COUNT(DISTINCT b.id)        AS times_bid,
                MAX(e.price)                AS max_price,
                MIN(e.price)                AS min_price,
                MAX(b.uploaded_at)          AS last_seen,
                COUNT(DISTINCT b.batch_id)  AS batches_participated
            FROM bids b
            LEFT JOIN extracted_fields e ON b.id = e.bid_id
            WHERE b.vendor_name IS NOT NULL AND b.vendor_name != ''
            GROUP BY b.vendor_name
            ORDER BY times_bid DESC, last_seen DESC
        """).fetchall()

        vendors = [dict(row) for row in rows]

    return {"vendors": vendors, "total": len(vendors)}


@router.get("/{vendor_name}/history")
async def get_vendor_history(vendor_name: str):
    """
    Full bid history for a specific vendor, enriched with extracted fields.
    """
    with get_db() as conn:
        rows = conn.execute("""
            SELECT
                b.id          AS bid_id,
                b.batch_id,
                b.filename,
                b.uploaded_at,
                e.price,
                e.lead_time,
                e.payment_terms,
                e.price_hold_days,
                e.warranty_terms
            FROM bids b
            LEFT JOIN extracted_fields e ON b.id = e.bid_id
            WHERE b.vendor_name = ?
            ORDER BY b.uploaded_at DESC
        """, (vendor_name,)).fetchall()

        if not rows:
            raise HTTPException(
                status_code=404,
                detail=f"No bids found for vendor: {vendor_name}"
            )

        history = [dict(row) for row in rows]

    return {
        "vendor_name": vendor_name,
        "total_bids": len(history),
        "history": history,
    }
