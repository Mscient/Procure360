import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.integrations.registry import get_adapter

def test_csv():
    # 1. Create a dummy CSV file
    dummy_csv = "test_bids.csv"
    with open(dummy_csv, "w", encoding="utf-8") as f:
        f.write("Supplier,Quote,DaysToDeliver,Terms,WarrantyLength,HoldDays\n")
        f.write("Acme Corp,15000,14,Net 30,1 Year,30\n")
        f.write("Globex,12500,21,Net 45,2 Years,60\n")
        
    print(f"Created {dummy_csv}")
    
    # 2. Get the CSV adapter from our registry
    print("Fetching CSV Adapter from registry...")
    adapter = get_adapter("csv")
    
    # 3. Define our mapping (simulating what the user would configure)
    source_config = {
        "file_path": dummy_csv,
        "mapping": {
            "Supplier": "vendor_name",
            "Quote": "price",
            "DaysToDeliver": "lead_time",
            "Terms": "payment_terms",
            "WarrantyLength": "warranty_terms",
            "HoldDays": "price_hold_days"
        }
    }
    
    print("Running extraction...")
    bids = adapter.fetch_bids(source_config)
    
    print(f"\nExtracted {len(bids)} bids:")
    for b in bids:
        print(f"  - Vendor: {b.get('vendor_name')}")
        print(f"    Price: ${b.get('price')} (type: {type(b.get('price')).__name__})")
        print(f"    Lead Time: {b.get('lead_time')}")
        print(f"    Payment Terms: {b.get('payment_terms')}")
        print(f"    Warranty: {b.get('warranty_terms')}")
        print(f"    Price Hold: {b.get('price_hold_days')} (type: {type(b.get('price_hold_days')).__name__})\n")
        
    # Cleanup
    os.remove(dummy_csv)

if __name__ == "__main__":
    test_csv()
