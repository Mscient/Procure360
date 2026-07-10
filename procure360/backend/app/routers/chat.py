from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.llm_client import generate_content_with_retry
from app.storage.db import get_db
from app.services.audit_logger import log_event

router = APIRouter()


class ChatRequest(BaseModel):
    contract_id: str
    question: str


@router.post("/")
async def chat_with_contract(request: ChatRequest):
    # Fetch the contract's parsed text so Gemini has real context to work with
    with get_db() as conn:
        row = conn.execute(
            "SELECT filename, raw_text FROM contracts WHERE id=?",
            (request.contract_id,),
        ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Contract not found")

    filename = row["filename"]
    raw_text = row["raw_text"] or ""

    # Truncate to ~12 000 chars to stay within Gemini's safe context window
    contract_excerpt = raw_text[:12_000] if len(raw_text) > 12_000 else raw_text

    prompt = f"""You are an expert legal assistant reviewing a procurement contract.
Answer the user's question based ONLY on the contract text provided below.
If the answer cannot be found in the contract, say so clearly.

Contract filename: {filename}

--- CONTRACT TEXT START ---
{contract_excerpt}
--- CONTRACT TEXT END ---

User question: {request.question}

Answer concisely and professionally."""

    try:
        answer = generate_content_with_retry(prompt)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}")

    # Audit: log the question so reviewers can see what was asked
    log_event(
        action_type="CHAT_QUESTION",
        entity_id=request.contract_id,
        details=f"Q: {request.question[:200]}",
    )

    return {"answer": answer}