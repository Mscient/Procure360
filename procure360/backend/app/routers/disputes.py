from fastapi import APIRouter
from pydantic import BaseModel
import uuid
from app.storage.db import get_db
from app.services.audit_logger import log_event

router = APIRouter()


class DisputeRequest(BaseModel):
    flag_id: str
    reason: str
    disputed_by: str


@router.post("/{flag_id}")
async def dispute_flag(flag_id: str, request: DisputeRequest):
    with get_db() as conn:
        sql_query = """
        INSERT INTO disputes (id, flag_id, reason, disputed_by)
        VALUES (?, ?, ?, ?);
        """
        values = (
            str(uuid.uuid4()),
            request.flag_id,
            request.reason,
            request.disputed_by,
        )
        conn.execute(sql_query, values)
        conn.commit()

    # Audit: log every dispute so the Audit Trail reflects accountability actions
    log_event(
        action_type="FLAG_DISPUTED",
        entity_id=request.flag_id,
        details=f"Disputed by: {request.disputed_by} | Reason: {request.reason}",
    )

    return {"flag_id": flag_id, "status": "disputed"}
