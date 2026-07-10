
from pydantic import BaseModel
from typing import Optional


class ContractFlag(BaseModel):
    id:str
    contract_id:str
    clause_text:Optional[str]
    flag_type:Optional[str]
    severity:Optional[str]
    source_location:Optional[str]
    created_at:Optional[str]