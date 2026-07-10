from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseAdapter(ABC):
    """
    The standard shape for all Procure360 integrations.
    Every adapter guarantees returning data in the exact format expected by bid_ranker.py.
    """

    @abstractmethod
    def fetch_bids(self, source_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract bids from a source system.
        
        Args:
            source_config: Connection details, mapping rules, or file paths needed by the adapter.
            
        Returns:
            A list of standardized bid dictionaries:
            {
                "vendor_name": str,
                "price": float,
                "lead_time": str,
                "payment_terms": str,
                "warranty_terms": str,
                "price_hold_days": int
            }
        """
        pass
