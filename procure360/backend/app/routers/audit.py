from fastapi import APIRouter, Response
from app.storage.db import get_db
import json

router = APIRouter()

# AuditTrail.jsx reads: log.event_type, log.entity_id, log.details
# DB columns are:        action_type,   input_ref,    user_note
# We alias them here so the schema stays unchanged.
_SELECT_AUDIT = """
    SELECT
        id,
        action_type  AS event_type,
        input_ref    AS entity_id,
        user_note    AS details,
        created_at
    FROM audit_log
    ORDER BY created_at DESC
"""


@router.get("/")
async def list_audit():
    with get_db() as conn:
        rows = conn.execute(_SELECT_AUDIT).fetchall()
        audit_list = [dict(row) for row in rows]
    return {"events": audit_list}


@router.get("/export")
async def export_audit():
    with get_db() as conn:
        rows = conn.execute(_SELECT_AUDIT).fetchall()
        jsonl_string = "".join(json.dumps(dict(row)) + "\n" for row in rows)

    return Response(
        content=jsonl_string,
        media_type="application/jsonl",
        headers={"content-disposition": "attachment; filename=audit.jsonl"},
    )
