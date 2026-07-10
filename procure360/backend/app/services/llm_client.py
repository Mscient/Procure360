import time
import google.generativeai as genai
from app import config

# Configure the global client once here
genai.configure(api_key=config.GEMINI_API_KEY)
_model = genai.GenerativeModel(config.GEMINI_MODEL)

def generate_content_with_retry(prompt: str, json_mode: bool = False, max_retries: int = 3) -> str:
    """
    Wrapper around Gemini generate_content that adds resilience against 
    rate limits (429), timeouts, and transient API failures.
    
    Args:
        prompt: The text prompt to send to Gemini.
        json_mode: If True, forces the response mime type to application/json.
        max_retries: Number of times to retry before giving up.
        
    Returns:
        The text response from the model.
        
    Raises:
        Exception: If the API fails after all retries are exhausted.
    """
    
    generation_config = None
    if json_mode:
        generation_config = genai.GenerationConfig(response_mime_type="application/json")
        
    attempt = 0
    while attempt < max_retries:
        try:
            response = _model.generate_content(
                prompt,
                generation_config=generation_config
            )
            return response.text
            
        except Exception as exc:
            attempt += 1
            error_msg = str(exc).lower()
            
            # Simple backoff logic
            wait_time = 2 ** attempt  # 2s, 4s, 8s...
            
            print(f"[LLMClient] Attempt {attempt} failed: {exc}")
            
            if attempt == max_retries:
                print(f"[LLMClient] Exhausted {max_retries} retries. Failing.")
                raise exc
                
            print(f"[LLMClient] Waiting {wait_time}s before retrying...")
            time.sleep(wait_time)
