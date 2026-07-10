
from fastapi import APIRouter, UploadFile,HTTPException
import uuid
from app.storage.db import get_db
from app.services.document_parser import parse_pdf
from app.services.contract_scanner import scan_contract
from app.services.clause_templates import scan_clauses

router = APIRouter()

@router.post("/upload")
async def upload_contract(file: UploadFile):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400,detail="ONly pdf are supported")
    file_bytes=await file.read()
    raw_text=parse_pdf(file_bytes)
    ai_flags=scan_contract(raw_text)
    rule_flags_raw=scan_clauses(raw_text)
    rule_flags=[
        {
            "clause_text":f.clause_text,
            "flag_type":f.flag_type,
            "severity":f.severity,
            "reason":f.reason
        } for f in rule_flags_raw
    ]
    flags=ai_flags+rule_flags
    contract_id=str(uuid.uuid4())


    with get_db() as conn:
        
        conn.execute(
            "INSERT INTO contracts (id, filename) VALUES (?, ?)",
            (contract_id, file.filename)
        )


        sql_query="""
         INSERT INTO flags (
            id,
            contract_id,
            clause_text,
            flag_type,
            severity,
            source_location
         )
         VALUES(?,?,?,?,?,?)
        """
        for flag in flags:
            values=(
                str(uuid.uuid4()),
                contract_id,
                flag['clause_text'],
                flag['flag_type'],
                flag['severity'],
                flag['reason']
                  # may be we just don't need to use it ,we can just use datetime module here
            )



            conn.execute(sql_query,values)
        conn.commit()


    return { 
        "id":contract_id,
        "filename":file.filename,
        "flags_found":len(flags),
        "flags":flags
        }



@router.get("/{contract_id}/flags")
async def get_contract_flags(contract_id: str):
    with get_db() as conn:
        sql_query=""" 
        SELECT * FROM flags WHERE contract_id=?;
        """ 
        rows=conn.execute(sql_query,(contract_id,)).fetchall()

        ranked_contract=[]
        for row in rows:
            ranked_contract.append(dict(row))

    return {"id": contract_id, "flags":ranked_contract}



@router.get("/")
async def get_all_contract():
    with get_db() as conn:
        rows=conn.execute("SELECT * FROM contracts ORDER BY uploaded_at DESC").fetchall()
        contract_list=[]
        for row in rows:
            contract_list.append(dict(row))

        return contract_list

@router.get("/analytics/risks")
async def get_risk_analytics():
    with get_db() as conn:
        rows = conn.execute("SELECT severity, COUNT(*) as count FROM flags GROUP BY severity").fetchall()
        result = [{"severity": row["severity"], "count": row["count"]} for row in rows]
        return result