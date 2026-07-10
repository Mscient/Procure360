from typing import List, Dict, Any
from .base_adapter import BaseAdapter

class KayaAdapter(BaseAdapter):
    """
    Adapter stub for the Kaya AI Platform.
    
    When Kaya provides an API for their project management/procurement platform, 
    this adapter will:
    1. Authenticate using source_config["api_key"]
    2. Fetch RFQ/bid responses for a given project_id
    3. Transform the Kaya-specific JSON into our standardized bid shape.
    """

    def fetch_bids(self, source_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        raise NotImplementedError(
            "Kaya integration is not yet implemented. "
            "Waiting on Kaya API access."
        )
