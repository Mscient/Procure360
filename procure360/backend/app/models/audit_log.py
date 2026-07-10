from pydantic import BaseModel
from typing import Optional

class AuditLog(BaseModel):
    id:str
    action_type:str
    input_ref:Optional[str]
    output_ref:Optional[str]
    user_note:Optional[str]
    created_at:str  

