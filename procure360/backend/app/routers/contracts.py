
from fastapi import APIRouter, UploadFile, HTTPException, Form
from pydantic import BaseModel
from typing import Optional
import uuid
from app.storage.db import get_db
from app.config import RAW_CONTRACTS_DIR, RAW_EXTRACTIONS_DIR
import json
from app.services.document_parser import parse_pdf
from app.services.contract_scanner import scan_contract
from app.services.clause_templates import scan_clauses
from app.services.audit_logger import log_event

router = APIRouter()


class StatusUpdate(BaseModel):
    status: str  # 'draft' | 'active' | 'expired'


@router.post("/upload")
async def upload_contract(
    file: UploadFile,
    expires_at: Optional[str] = Form(None),  # e.g. "2026-12-31"
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    contract_id = str(uuid.uuid4())
    
    contract_dir = RAW_CONTRACTS_DIR / contract_id
    contract_dir.mkdir(parents=True, exist_ok=True)
    RAW_EXTRACTIONS_DIR.mkdir(parents=True, exist_ok=True)
    
    raw_file_path = contract_dir / file.filename

    file_bytes = await file.read()
    raw_file_path.write_bytes(file_bytes)
    
    raw_text = parse_pdf(file_bytes)

    ai_flags = scan_contract(raw_text)
    rule_flags_raw = scan_clauses(raw_text)
    rule_flags = [
        {
            "clause_text": f.clause_text,
            "flag_type": f.flag_type,
            "severity": f.severity,
            "reason": f.reason,
        }
        for f in rule_flags_raw
    ]
    flags = ai_flags + rule_flags
    
    raw_extract_path = RAW_EXTRACTIONS_DIR / f"{contract_id}_flags.json"
    try:
        raw_extract_path.write_text(json.dumps(flags, indent=2))
    except TypeError:
        raw_extract_path.write_text(str(flags))
    
    with get_db() as conn:
        # Store filename + the full parsed text + lifecycle fields
        conn.execute(
            "INSERT INTO contracts (id, filename, raw_text, status, expires_at, raw_file_path) VALUES (?, ?, ?, 'active', ?, ?)",
            (contract_id, file.filename, raw_text, expires_at, str(raw_file_path)),
        )

        sql_query = """
         INSERT INTO flags (
            id,
            contract_id,
            clause_text,
            flag_type,
            severity,
            reason
         )
         VALUES (?, ?, ?, ?, ?, ?)
        """
        for flag in flags:
            values = (
                str(uuid.uuid4()),
                contract_id,
                flag["clause_text"],
                flag["flag_type"],
                flag["severity"],
                flag["reason"],   # correctly stored in the `reason` column now
            )
            conn.execute(sql_query, values)

        conn.commit()

    # Audit: record this upload so the Enterprise Audit Trail is populated
    log_event(
        action_type="CONTRACT_UPLOADED",
        entity_id=contract_id,
        details=f"Filename: {file.filename} | Flags found: {len(flags)}",
    )

    return {
        "id": contract_id,
        "filename": file.filename,
        "status": "active",
        "expires_at": expires_at,
        "flags_found": len(flags),
        "flags": flags,
    }


@router.patch("/{contract_id}/status")
async def update_contract_status(contract_id: str, body: StatusUpdate):
    """Update contract lifecycle status: draft | active | expired."""
    allowed = {"draft", "active", "expired"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail=f"status must be one of {allowed}")

    with get_db() as conn:
        result = conn.execute(
            "UPDATE contracts SET status=? WHERE id=?",
            (body.status, contract_id),
        )
        conn.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Contract not found")

    log_event(
        action_type="CONTRACT_STATUS_UPDATED",
        entity_id=contract_id,
        details=f"Status changed to: {body.status}",
    )
    return {"id": contract_id, "status": body.status}


@router.get("/{contract_id}/flags")
async def get_contract_flags(contract_id: str):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM flags WHERE contract_id=?", (contract_id,)
        ).fetchall()
        flags = [dict(row) for row in rows]

    return {"id": contract_id, "flags": flags}


@router.get("/")
async def get_all_contract():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM contracts ORDER BY uploaded_at DESC"
        ).fetchall()
        return [dict(row) for row in rows]


@router.get("/analytics/risks")
async def get_risk_analytics():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT severity, COUNT(*) as count FROM flags GROUP BY severity"
        ).fetchall()
        return [{"severity": row["severity"], "count": row["count"]} for row in rows]


@router.get("/analytics/flag-types")
async def get_flag_types_analytics():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT flag_type, COUNT(*) as count FROM flags GROUP BY flag_type ORDER BY count DESC"
        ).fetchall()
        return [{"flag_type": row["flag_type"], "count": row["count"]} for row in rows]