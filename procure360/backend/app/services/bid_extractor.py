import json 
import google.generativeai as genai
from app import config


genai.configure(api_key=config.GEMINI_API_KEY)

model=genai.GenerativeModel(config.GEMINI_MODEL)

def extract_bid_data(raw_text:str)->dict:
    """ promt Gemini to extract  specific fields from raw bit text.
    Returns a dictionary 
    """

    prompt=f"""

    you are an expert procurement assistant .Extract the following information 
    from the bid document text below.

    Return only  a valid JSON objec with the following keys.
    IF a value is not found ,set it to null.

    keys:
    -vendor_name(string)
    -price(float,just number)
    -lead_time(string,4 weeks)
    -payment_terms(string)
    -price_hold_days(integer ,how  many days the price is valid for)
    -warranty_terms(string)


    Bid TEXT
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
        return data
    except json.JSONDecodeError:
        print("[Error] Gemini did not return valid JSON")
        return {}



     
    
