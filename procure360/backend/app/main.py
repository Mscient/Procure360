from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import config
from app.storage.db import init_db
from app.routers import bids ,contracts, audit,disputes,chat



@asynccontextmanager
async def lifespan(app:FastAPI):
    init_db()    # create tables on first run 
    yield        # server runs here


app=FastAPI(
    title=config.APP_TITLE,
    version=config.APP_VERSION,
    description=config.APP_DESCRIPTION,
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(bids.router ,prefix="/bids", tags=["bids"])
app.include_router(contracts.router,prefix="/contracts",tags=["contracts"])
app.include_router(audit.router,prefix="/audit",tags=["audit"])
app.include_router(disputes.router,prefix="/disputes",tags=["disputes"])
app.include_router(chat.router,prefix="/chat",tags=["chat"])




