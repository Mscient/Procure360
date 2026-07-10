from fastapi import APIRouter,Response
from app.storage.db import get_db
import uuid,json

from app.services.document_parser import parse_pdf
from app.services.contract_scanner import scan_contract

router = APIRouter()



@router.get("/")
async def list_audit():

    with get_db() as conn:
        sql_query="""
        SELECT * FROM audit_log
        ORDER BY created_at DESC;
        """
        audit_list=[]
        rows=conn.execute(sql_query).fetchall()
        for row in rows:
            audit_list.append(dict(row))
        # rows.sort(key =lambda x:x['created_at'])
    return {"events": audit_list}


@router.get("/export")
async def export_audit():
    with get_db() as conn:
        sql_query="""
        SELECT * FROM audit_log
        ORDER BY created_at DESC;
        """
        jsonl_string=""
        rows=conn.execute(sql_query).fetchall()
        for row in rows:
            jsonl_string+=json.dumps(dict(row))+'\n'


        return Response(
            content=jsonl_string,
            media_type="application/jsonl",
            headers={"content-disposition": "attachment; filename=audit.jsonl"}

        )

        
