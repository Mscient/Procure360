import json
from app.services.llm_client import generate_content_with_retry


def extract_bid_data(raw_text: str) -> dict:
    """Prompt Gemini to extract specific fields from raw bid text.
    Returns a dictionary, or {} on any API / parse failure.
    """

    prompt = f"""
    You are an expert procurement assistant. Extract the following information
    from the bid document text below.

    Return only a valid JSON object with the following keys.
    If a value is not found, set it to null.

    Keys:
    - vendor_name (string)
    - price (float, just the number)
    - lead_time (string, e.g. "4 weeks")
    - payment_terms (string)
    - price_hold_days (integer, how many days the price is valid for)
    - warranty_terms (string)

    Bid Text:
    {raw_text}
    """

    try:
        # Calls our new wrapper which handles retries and backoff
        response_text = generate_content_with_retry(prompt, json_mode=True)
        try:
            # Inner try: protects against malformed JSON in the response
            return json.loads(response_text)
        except json.JSONDecodeError:
            print("[BidExtractor] Gemini returned non-JSON — skipping this bid")
            return {}
    except Exception as exc:
        print(f"[BidExtractor] LLM Client failed completely: {exc}")
        return {}
