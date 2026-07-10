import csv
from typing import List, Dict, Any
from .base_adapter import BaseAdapter

class CSVAdapter(BaseAdapter):
    """
    Adapter for reading bids from CSV or Excel exports.
    Allows dynamic mapping of CSV column names to our internal schema.
    """

    def fetch_bids(self, source_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        file_path = source_config.get("file_path")
        if not file_path:
            raise ValueError("CSVAdapter requires a 'file_path' in source_config")

        # Default mapping fallback if the user doesn't provide one
        mapping = source_config.get("mapping", {
            "Vendor": "vendor_name",
            "Quoted Price": "price",
            "Lead Time": "lead_time",
            "Payment Terms": "payment_terms",
            "Warranty": "warranty_terms",
            "Price Hold": "price_hold_days"
        })

        bids = []
        try:
            with open(file_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    bid = {
                        "vendor_name": "Unknown",
                        "price": 0.0,
                        "lead_time": None,
                        "payment_terms": None,
                        "warranty_terms": None,
                        "price_hold_days": None
                    }
                    
                    # Apply mapping
                    for csv_col, internal_key in mapping.items():
                        raw_val = row.get(csv_col)
                        if raw_val is not None:
                            val = str(raw_val).strip()
                            if not val:
                                continue
                            
                            # Basic type coercion for numeric fields
                            if internal_key == "price":
                                try:
                                    bid[internal_key] = float(val.replace(',', '').replace('$', ''))
                                except ValueError:
                                    bid[internal_key] = 0.0
                            elif internal_key == "price_hold_days":
                                try:
                                    bid[internal_key] = int(val)
                                except ValueError:
                                    bid[internal_key] = None
                            else:
                                bid[internal_key] = val
                    
                    # Only add if we got at least a vendor name or price
                    if bid["vendor_name"] != "Unknown" or bid["price"] > 0:
                        bids.append(bid)
        except Exception as e:
            print(f"[CSVAdapter] Failed to process file {file_path}: {e}")
            raise
            
        return bids
