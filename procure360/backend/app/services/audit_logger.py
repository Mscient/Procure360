"""
Audit Logger — Procure360
=========================
Central function for writing immutable audit trail entries.

Every significant system action (contract upload, bid batch, dispute, chat)
calls log_event() so the Enterprise Audit Trail page always has real data.

Usage:
    from app.services.audit_logger import log_event

    log_event(
        action_type="CONTRACT_UPLOADED",
        entity_id=contract_id,
        details=f"Filename: {filename}, {len(flags)} flags found",
    )
"""

import uuid
from app.storage.db import get_db


def log_event(
    action_type: str,
    entity_id: str = "",
    details: str = "",
    user_note: str = "",
) -> None:
    """
    Insert one row into audit_log.

    Parameters
    ----------
    action_type : str
        Machine-readable event name, e.g. "CONTRACT_UPLOADED", "FLAG_DISPUTED".
        Stored in the `action_type` column; aliased as `event_type` by the audit
        router so AuditTrail.jsx can read log.event_type without a schema change.
    entity_id : str
        The primary key of the object being acted upon (contract_id, flag_id …).
        Stored in `input_ref`; aliased as `entity_id` by the audit router.
    details : str
        Human-readable summary of what happened.
        Stored in `user_note`; aliased as `details` by the audit router.
    user_note : str
        Optional free-form note (e.g. the disputed_by name).
        Stored in `output_ref`.
    """
    try:
        db = get_db()
        db.execute(
            """
            INSERT INTO audit_log (id, action_type, input_ref, output_ref, user_note)
            VALUES (?, ?, ?, ?, ?)
            """,
            (str(uuid.uuid4()), action_type, entity_id, user_note, details),
        )
        db.commit()
    except Exception as exc:
        # Never let audit logging crash a user-facing request
        print(f"[AuditLogger] Failed to write event '{action_type}': {exc}")
