from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# CoinGecko base URL (free, no key needed)
COINGECKO_BASE = "https://api.coingecko.com/api/v3"

# --- Models ---
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# --- CoinGecko Proxy Endpoints ---
@api_router.get("/market-data")
async def get_market_data():
    """Fetch top crypto coins by market cap from CoinGecko"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as hc:
            resp = await hc.get(f"{COINGECKO_BASE}/coins/markets", params={
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": 20,
                "page": 1,
                "sparkline": True,
                "price_change_percentage": "1h,24h,7d"
            })
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"CoinGecko market-data error: {e}")
        return []

@api_router.get("/trending")
async def get_trending():
    """Fetch trending coins from CoinGecko"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as hc:
            resp = await hc.get(f"{COINGECKO_BASE}/search/trending")
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"CoinGecko trending error: {e}")
        return {"coins": []}

@api_router.get("/global-stats")
async def get_global_stats():
    """Fetch global crypto market stats"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as hc:
            resp = await hc.get(f"{COINGECKO_BASE}/global")
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"CoinGecko global error: {e}")
        return {"data": {}}

@api_router.get("/coin/{coin_id}")
async def get_coin_detail(coin_id: str):
    """Fetch detailed info for a specific coin"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as hc:
            resp = await hc.get(f"{COINGECKO_BASE}/coins/{coin_id}", params={
                "localization": "false",
                "tickers": "false",
                "community_data": "false",
                "developer_data": "false",
                "sparkline": True
            })
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"CoinGecko coin detail error: {e}")
        return {}

# --- System Logs (stored in MongoDB) ---
@api_router.get("/system-logs")
async def get_system_logs():
    logs = await db.system_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    return logs

@api_router.post("/system-logs")
async def add_system_log(message: str = "System event"):
    log_entry = {
        "id": str(uuid.uuid4()),
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": "INFO"
    }
    await db.system_logs.insert_one(log_entry)
    del log_entry["_id"]
    return log_entry

# --- Original Endpoints ---
@api_router.get("/")
async def root():
    return {"message": "LENSTEDREAL Quantum Terminal API v10"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
