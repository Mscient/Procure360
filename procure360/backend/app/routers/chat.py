from fastapi import APIRouter,HTTPException
from pydantic import BaseModel
import uuid 
import  google.generativeai as genai
from app.storage.db import get_db

router=APIRouter()


class Chatrequest(BaseModel):
    contract_id:str
    question:str

@router.post("/")
async def chat_with_contract(request:Chatrequest):

    sql_query="""
    SELECT filename FROM contracts WHERE id=?"""
    with get_db() as conn:
        row=conn.execute(sql_query,((request.contract_id),)).fetchone()
    if not row:
        raise HTTPException(status_code=404,detail="Contract not found")

    try:
        prompt=f"""
    Act as legal assistant .The user is asking a question about a procurement contract.
    Question:{request.question}
    Answer concisely and professinoaly.
    """

        model=genai.GenerativeModel("gemini-2.5-flash")
        response=model.generate_content(prompt)
        return {"answer":response.text}
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))


 