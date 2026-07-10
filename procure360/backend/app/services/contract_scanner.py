import json
from app.services.llm_client import generate_content_with_retry


def scan_contract(raw_text: str) -> list[dict]:
    """
    Prompt Gemini to find risky clauses in a contract.
    Returns a list of dicts (one per risk flag), or [] on any failure.
    """

    prompt = f"""
        You are an expert procurement lawyer. Review the following contract text.
    Identify any clauses that represent a risk to the buyer (e.g. unfair payment terms, missing warranties, high liability).

    Return ONLY a valid JSON array of objects. If no risks are found, return an empty array [].
    Each object must have these exact keys:
    - clause_text (string, the exact quote from the contract)
    - flag_type (string, e.g. "PAYMENT_RISK", "LIABILITY_RISK")
    - severity (string, must be "HIGH", "MEDIUM", or "LOW")
    - reason (string, brief explanation of why it is risky)

    Contract Text:
    {raw_text}
    """

    try:
        # Calls our new wrapper which handles retries and backoff
        response_text = generate_content_with_retry(prompt, json_mode=True)
        try:
            # Inner try: protects against malformed JSON in the response
            data = json.loads(response_text)
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                return data.get("flags", [data])
            return []
        except json.JSONDecodeError:
            print("[ContractScanner] Gemini returned non-JSON — returning no flags")
            return []
    except Exception as exc:
        print(f"[ContractScanner] LLM Client failed completely: {exc}")
        return []
