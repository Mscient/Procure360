from fastapi import APIRouter, UploadFile
import uuid
from app.storage.db import get_db
import time
import datetime 
import json

from app.services.bid_ranker import rank_bids
from app.services.bid_extractor import extract_bid_data
from app.services.document_parser import parse_pdf
from app.services.explainability import explain_bid_score

router = APIRouter()

@router.post("/upload")
async def upload_bids(files: list[UploadFile]):
    
    batch_id=str(uuid.uuid4())
    processed_bids=[]

    for  file in files:
        if not file.filename.endswith(".pdf"):
            continue
        
        file_bytes=await file.read()
        raw_text=parse_pdf(file_bytes)

        extracted_data=extract_bid_data(raw_text)

        bid_result={
            "id":str(uuid.uuid4()),
            "batch_id":batch_id,
            "filename":file.filename,
            "extracted_data":extracted_data ,
            
        }
        processed_bids.append(bid_result)

        with get_db() as conn:
            sql_query = """
            INSERT INTO bids (id,batch_id, vendor_name,filename)
            VALUES (?, ?, ?, ?);
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
                bid_result['filename']
            )

            conn.execute(sql_query, values)

            extracted_values=(
                str(uuid.uuid4()),
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

    return {"batch_id":batch_id,
            "count": len(files),
            "bids":processed_bids
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