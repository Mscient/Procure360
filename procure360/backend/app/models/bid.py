from pydantic import BaseModel
from typing import Optional

class Bid(BaseModel):
    id:str
    batch_id:str
    vendor_name:Optional[str]
    filename:Optional[str]
    price:Optional[str]
    lead_time:Optional[str]
    payment_terms:Optional[str]
    price_hold_days:Optional[str]
    warranty_terms:Optional[str]
    uploaded_at:Optional[str]







