from app.config import GEMINI_API_KEY
import json 
import google.generativeai as genai
from app import config

genai.configure(api_key=GEMINI_API_KEY)
model=genai.GenerativeModel(config.GEMINI_MODEL)

def scan_contract(raw_text:str)->list[dict]:
    """
    Promts Gemini to find risky clauses in a contract.
    Returns a list of dictionaries ,where each dict is a risk  flag.
    
    """

    prompt=f"""
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

    response=model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json"
        )
    )

    try:
        data=json.loads(response.text)
        
        if isinstance(data,list):
            return data
        elif isinstance(data,dict):
            return data.get("flags",[data])
        return []
    except json.JSONDecodeError:
        print("[Error] Gemini did not return Valid JSON")
        return []