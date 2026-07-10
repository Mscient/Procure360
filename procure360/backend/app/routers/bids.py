from fastapi import APIRouter, UploadFile, HTTPException
import uuid
from app.storage.db import get_db
from app.config import RAW_BIDS_DIR, RAW_EXTRACTIONS_DIR
import json

from app.services.bid_ranker import rank_bids
from app.services.bid_extractor import extract_bid_data
from app.services.document_parser import parse_pdf
from app.services.explainability import explain_bid_score
from app.services.audit_logger import log_event

router = APIRouter()

@router.post("/upload")
async def upload_bids(files: list[UploadFile]):
    
    batch_id=str(uuid.uuid4())
    processed_bids=[]

    batch_dir = RAW_BIDS_DIR / batch_id
    batch_dir.mkdir(parents=True, exist_ok=True)
    RAW_EXTRACTIONS_DIR.mkdir(parents=True, exist_ok=True)

    for  file in files:
        if not file.filename.endswith(".pdf"):
            continue
        
        file_bytes=await file.read()
        
        # Save raw pdf
        raw_file_path = batch_dir / file.filename
        raw_file_path.write_bytes(file_bytes)
        
        raw_text=parse_pdf(file_bytes)

        extracted_data=extract_bid_data(raw_text)
        bid_id = str(uuid.uuid4())
        extracted_id = str(uuid.uuid4())
        
        # Save raw extraction
        raw_extract_path = RAW_EXTRACTIONS_DIR / f"{extracted_id}.json"
        raw_extract_path.write_text(json.dumps(extracted_data, indent=2))

        bid_result={
            "id": bid_id,
            "batch_id":batch_id,
            "filename":file.filename,
            "extracted_data":extracted_data ,
            "raw_file_path": str(raw_file_path),
            "extracted_id": extracted_id
        }
        processed_bids.append(bid_result)

        with get_db() as conn:
            sql_query = """
            INSERT INTO bids (id,batch_id, vendor_name,filename, raw_file_path)
            VALUES (?, ?, ?, ?, ?);
            """

            extracted_query="""
            INSERT INTO extracted_fields(
            id,bid_id ,price ,lead_time,payment_terms,price_hold_days ,warranty_terms ,raw_json)
            VALUES(?,?,?,?,?,?,?,?);
            """

            values=(
                bid_result['id'],
                bid_result['batch_id'],
                bid_result['extracted_data'].get("vendor_name", "Unknown"),
                bid_result['filename'],
                bid_result['raw_file_path']
            )

            conn.execute(sql_query, values)

            extracted_values=(
                bid_result['extracted_id'],
                bid_result['id'],
                bid_result['extracted_data'].get('price', None),
                bid_result['extracted_data'].get('lead_time', "Unknown"),
                bid_result['extracted_data'].get('payment_terms', "Unknown"),
                bid_result['extracted_data'].get('price_hold_days', None),
                bid_result['extracted_data'].get('warranty_terms', "Unknown"),
                json.dumps(bid_result['extracted_data'])
            )

            conn.execute(extracted_query, extracted_values)
            conn.commit()

    # Audit: record the batch upload so the Audit Trail page is populated
    log_event(
        action_type="BID_BATCH_UPLOADED",
        entity_id=batch_id,
        details=f"{len(processed_bids)} bid(s) processed from {len(files)} file(s)",
    )

    return {
        "batch_id": batch_id,
        "count": len(files),
        "bids": processed_bids,
    }








import tempfile
import os
from app.integrations.registry import get_adapter

@router.post("/upload-csv")
async def upload_csv(file: UploadFile):
    if not file.filename.endswith(".csv") and not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .csv or .xlsx files are supported")
        
    # Save the uploaded file temporarily so the adapter can read it
    fd, temp_path = tempfile.mkstemp(suffix=".csv")
    try:
        with os.fdopen(fd, 'wb') as f:
            content = await file.read()
            f.write(content)
            
        adapter = get_adapter("csv")
        extracted_bids = adapter.fetch_bids({"file_path": temp_path})
    finally:
        os.remove(temp_path)
        
    batch_id = str(uuid.uuid4())
    processed_bids = []
    
    batch_dir = RAW_BIDS_DIR / batch_id
    batch_dir.mkdir(parents=True, exist_ok=True)
    RAW_EXTRACTIONS_DIR.mkdir(parents=True, exist_ok=True)
    
    raw_file_path = batch_dir / file.filename
    # Re-save the file since we deleted temp file
    file.file.seek(0)
    raw_file_path.write_bytes(file.file.read())
    
    with get_db() as conn:
        for bid_data in extracted_bids:
            bid_id = str(uuid.uuid4())
            extracted_id = str(uuid.uuid4())
            
            raw_extract_path = RAW_EXTRACTIONS_DIR / f"{extracted_id}.json"
            raw_extract_path.write_text(json.dumps(bid_data, indent=2))
            
            sql_query = """
            INSERT INTO bids (id, batch_id, vendor_name, filename, raw_file_path)
            VALUES (?, ?, ?, ?, ?);
            """
            
            extracted_query = """
            INSERT INTO extracted_fields(
            id, bid_id, price, lead_time, payment_terms, price_hold_days, warranty_terms, raw_json)
            VALUES(?,?,?,?,?,?,?,?);
            """
            
            conn.execute(sql_query, (
                bid_id,
                batch_id,
                bid_data.get("vendor_name", "Unknown"),
                file.filename,
                str(raw_file_path)
            ))
            
            conn.execute(extracted_query, (
                extracted_id,
                bid_id,
                bid_data.get('price', None),
                bid_data.get('lead_time', "Unknown"),
                bid_data.get('payment_terms', "Unknown"),
                bid_data.get('price_hold_days', None),
                bid_data.get('warranty_terms', "Unknown"),
                json.dumps(bid_data)
            ))
            
            processed_bids.append({"id": bid_id, "vendor_name": bid_data.get("vendor_name")})
            
        conn.commit()
        
    # Audit: record the batch upload
    log_event(
        action_type="BID_BATCH_UPLOADED_CSV",
        entity_id=batch_id,
        details=f"{len(processed_bids)} bid(s) processed from CSV {file.filename}",
    )
    
    return {
        "batch_id": batch_id,
        "count": len(processed_bids),
    }

@router.get("/compare/{batch_id}")
async def compare_bids(batch_id: str):

    with get_db() as conn:
        sql_query="""
            SELECT b.vendor_name,b.filename,e.price,e.lead_time,e.payment_terms,b.id as bid_id
            FROM bids b
            JOIN extracted_fields e ON b.id=e.bid_id
            WHERE b.batch_id=?
        """
        rows=conn.execute(sql_query,(batch_id,)).fetchall()

        raw_bids=[]
        for row in rows:
            raw_bids.append(dict(row))

        ranked_bids=rank_bids(raw_bids)
        for bid in ranked_bids:
            bid["explanation"]=explain_bid_score(bid)

    return {"batch_id": batch_id, "ranked_bids": ranked_bids} 