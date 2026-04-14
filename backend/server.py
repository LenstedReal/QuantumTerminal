from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os, logging, uuid, secrets, bcrypt, jwt, pyotp, qrcode, io, base64, httpx
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import Optional, List
from user_agents import parse as parse_ua

import re

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
COINGECKO_BASE = "https://api.coingecko.com/api/v3"
DISCORD_CLIENT_ID = os.environ.get("DISCORD_CLIENT_ID", "")
DISCORD_CLIENT_SECRET = os.environ.get("DISCORD_CLIENT_SECRET", "")
DISCORD_REDIRECT_URI = os.environ.get("DISCORD_REDIRECT_URI", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Password Hashing ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

# --- JWT ---
def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=30), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie(key="access_token", value=access, httponly=True, secure=False, samesite="lax", max_age=1800, path="/")
    response.set_cookie(key="refresh_token", value=refresh, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

# --- Auth Helper ---
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Kimlik doğrulanamadı")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Geçersiz token tipi")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        user.pop("totp_secret", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi doldu")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Geçersiz token")

# --- Login Activity Logging ---
async def log_login_activity(request: Request, email: str, success: bool, user_id: str = None):
    ua_string = request.headers.get("User-Agent", "Unknown")
    ua = parse_ua(ua_string)
    ip = request.headers.get("X-Forwarded-For", request.headers.get("X-Real-IP", request.client.host if request.client else "Unknown"))
    if isinstance(ip, str) and "," in ip:
        ip = ip.split(",")[0].strip()
    log_entry = {
        "id": str(uuid.uuid4()),
        "email": email,
        "user_id": user_id,
        "ip_address": ip,
        "device": f"{ua.browser.family} {ua.browser.version_string}",
        "os": f"{ua.os.family} {ua.os.version_string}",
        "device_type": "Mobile" if ua.is_mobile else "Tablet" if ua.is_tablet else "Desktop",
        "success": success,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.login_logs.insert_one(log_entry)
    return log_entry

# --- Brute Force Protection ---
async def check_brute_force(ip: str, email: str):
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.now(timezone.utc) < datetime.fromisoformat(locked_until):
            raise HTTPException(status_code=429, detail="Çok fazla başarısız deneme. 15 dakika sonra tekrar deneyin.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})

async def record_failed_attempt(ip: str, email: str):
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt:
        new_count = attempt.get("count", 0) + 1
        update = {"$set": {"count": new_count}}
        if new_count >= 5:
            update["$set"]["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one({"identifier": identifier}, update)
    else:
        await db.login_attempts.insert_one({"identifier": identifier, "count": 1, "created_at": datetime.now(timezone.utc).isoformat()})

async def clear_failed_attempts(ip: str, email: str):
    identifier = f"{ip}:{email}"
    await db.login_attempts.delete_one({"identifier": identifier})

def validate_strong_password(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Parola en az 8 karakter olmalıdır.")
    if not re.search(r'[A-Z]', password):
        raise HTTPException(status_code=400, detail="Parola en az 1 büyük harf içermelidir.")
    if not re.search(r'[a-z]', password):
        raise HTTPException(status_code=400, detail="Parola en az 1 küçük harf içermelidir.")
    if not re.search(r'[0-9]', password):
        raise HTTPException(status_code=400, detail="Parola en az 1 rakam içermelidir.")
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', password):
        raise HTTPException(status_code=400, detail="Parola en az 1 özel karakter içermelidir (!@#$%^&* vb.)")

# --- Models ---
class RegisterInput(BaseModel):
    email: str
    password: str
    name: str

class LoginInput(BaseModel):
    email: str
    password: str

class VerifyEmailInput(BaseModel):
    code: str

class Setup2FAResponse(BaseModel):
    secret: str
    qr_code: str

class Verify2FAInput(BaseModel):
    code: str

class LoginWith2FAInput(BaseModel):
    email: str
    password: str
    totp_code: str

# --- Auth Endpoints ---
@api_router.post("/auth/register")
async def register(inp: RegisterInput, response: Response, request: Request):
    email = inp.email.lower().strip()
    if not email or "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Geçerli bir e-posta adresi girin.")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")
    validate_strong_password(inp.password)

    verification_code = str(secrets.randbelow(900000) + 100000)
    user_doc = {
        "email": email,
        "password_hash": hash_password(inp.password),
        "name": inp.name,
        "role": "user",
        "email_verified": False,
        "verification_code": verification_code,
        "totp_enabled": False,
        "totp_secret": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    logger.info(f"[EMAIL VERIFICATION] User {email} - Code: {verification_code}")

    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)

    await log_login_activity(request, email, True, user_id)

    return {"id": user_id, "email": email, "name": inp.name, "role": "user", "email_verified": False, "totp_enabled": False, "verification_code_hint": verification_code}

@api_router.post("/auth/login")
async def login(inp: LoginInput, response: Response, request: Request):
    email = inp.email.lower().strip()
    if not email or "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Geçerli bir e-posta adresi girin.")
    ip = request.headers.get("X-Forwarded-For", request.headers.get("X-Real-IP", request.client.host if request.client else "0.0.0.0"))
    if isinstance(ip, str) and "," in ip:
        ip = ip.split(",")[0].strip()

    await check_brute_force(ip, email)

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(inp.password, user["password_hash"]):
        await record_failed_attempt(ip, email)
        if user:
            await log_login_activity(request, email, False)
        raise HTTPException(status_code=401, detail="Geçersiz e-posta veya parola.")

    user_id = str(user["_id"])

    # Check if 2FA is enabled
    if user.get("totp_enabled"):
        # Return a partial response requiring 2FA
        temp_token = jwt.encode(
            {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=5), "type": "2fa_pending"},
            JWT_SECRET, algorithm=JWT_ALGORITHM
        )
        return {"requires_2fa": True, "temp_token": temp_token}

    await clear_failed_attempts(ip, email)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)

    await log_login_activity(request, email, True, user_id)

    return {
        "id": user_id, "email": email, "name": user.get("name", ""),
        "role": user.get("role", "user"), "email_verified": user.get("email_verified", False),
        "totp_enabled": user.get("totp_enabled", False), "requires_2fa": False
    }

@api_router.post("/auth/verify-2fa-login")
async def verify_2fa_login(inp: Verify2FAInput, request: Request, response: Response, temp_token: str = ""):
    # Get temp token from body or header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        temp_token = auth_header[7:]

    if not temp_token:
        raise HTTPException(status_code=400, detail="Missing temporary token")

    try:
        payload = jwt.decode(temp_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "2fa_pending":
            raise HTTPException(status_code=400, detail="Invalid token")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    totp = pyotp.TOTP(user["totp_secret"])
    if not totp.verify(inp.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")

    user_id = str(user["_id"])
    ip = request.headers.get("X-Forwarded-For", request.headers.get("X-Real-IP", request.client.host if request.client else "0.0.0.0"))
    if isinstance(ip, str) and "," in ip:
        ip = ip.split(",")[0].strip()
    await clear_failed_attempts(ip, user["email"])

    access = create_access_token(user_id, user["email"])
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)

    await log_login_activity(request, user["email"], True, user_id)

    return {
        "id": user_id, "email": user["email"], "name": user.get("name", ""),
        "role": user.get("role", "user"), "email_verified": user.get("email_verified", False),
        "totp_enabled": True, "requires_2fa": False
    }

@api_router.post("/auth/verify-email")
async def verify_email(inp: VerifyEmailInput, request: Request):
    user = await get_current_user(request)
    db_user = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.get("email_verified"):
        return {"message": "Email already verified"}
    if db_user.get("verification_code") != inp.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"email_verified": True}, "$unset": {"verification_code": ""}})
    return {"message": "Email verified successfully"}

@api_router.post("/auth/setup-2fa")
async def setup_2fa(request: Request):
    user = await get_current_user(request)
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=user["email"], issuer_name="LENSTEDREAL")

    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode()

    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"totp_secret": secret}})

    return {"secret": secret, "qr_code": f"data:image/png;base64,{qr_b64}"}

@api_router.post("/auth/enable-2fa")
async def enable_2fa(inp: Verify2FAInput, request: Request):
    user = await get_current_user(request)
    db_user = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not db_user or not db_user.get("totp_secret"):
        raise HTTPException(status_code=400, detail="2FA not set up yet")
    totp = pyotp.TOTP(db_user["totp_secret"])
    if not totp.verify(inp.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"totp_enabled": True}})
    return {"message": "2FA enabled successfully"}

@api_router.post("/auth/disable-2fa")
async def disable_2fa(inp: Verify2FAInput, request: Request):
    user = await get_current_user(request)
    db_user = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not db_user or not db_user.get("totp_secret"):
        raise HTTPException(status_code=400, detail="2FA not enabled")
    totp = pyotp.TOTP(db_user["totp_secret"])
    if not totp.verify(inp.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"totp_enabled": False, "totp_secret": None}})
    return {"message": "2FA disabled"}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(key="access_token", value=access, httponly=True, secure=False, samesite="lax", max_age=1800, path="/")
        return {"message": "Token refreshed"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# --- Login Activity Logs (public) ---
@api_router.get("/login-logs")
async def get_login_logs():
    logs = await db.login_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return logs

# --- Discord OAuth (CSRF state korumalı) ---
DISCORD_API_BASE = "https://discord.com/api/v10"
DISCORD_AUTH_URL = "https://discord.com/api/oauth2/authorize"
DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"

@api_router.get("/auth/discord/url")
async def get_discord_auth_url(response: Response):
    if not DISCORD_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Discord entegrasyonu henüz yapılandırılmadı.")
    # State üret - CSRF koruması
    state = secrets.token_hex(16)
    from urllib.parse import urlencode, quote
    params = urlencode({
        "client_id": DISCORD_CLIENT_ID,
        "redirect_uri": DISCORD_REDIRECT_URI,
        "response_type": "code",
        "scope": "identify email",
        "state": state,
        "prompt": "consent",
    })
    # State'i cookie'de sakla
    response.set_cookie(key="discord_oauth_state", value=state, httponly=True, secure=False, samesite="lax", max_age=300, path="/")
    url = f"{DISCORD_AUTH_URL}?{params}"
    return {"url": url}

@api_router.get("/auth/discord/callback")
async def discord_callback(code: str, state: str, request: Request):
    from starlette.responses import RedirectResponse
    if not DISCORD_CLIENT_ID or not DISCORD_CLIENT_SECRET:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=discord_config")

    # State doğrula - CSRF koruması
    saved_state = request.cookies.get("discord_oauth_state")
    if not saved_state or saved_state != state:
        logger.warning(f"Discord OAuth state mismatch: expected={saved_state}, got={state}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=discord_state")

    try:
        async with httpx.AsyncClient(timeout=15.0) as hc:
            # Code ile access token al
            token_resp = await hc.post(DISCORD_TOKEN_URL, data={
                "client_id": DISCORD_CLIENT_ID,
                "client_secret": DISCORD_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": str(code),
                "redirect_uri": DISCORD_REDIRECT_URI,
            }, headers={"Content-Type": "application/x-www-form-urlencoded"})
            token_resp.raise_for_status()
            tokens = token_resp.json()

            # Token ile kullanıcı bilgisi çek
            user_resp = await hc.get(f"{DISCORD_API_BASE}/users/@me", headers={
                "Authorization": f"Bearer {tokens['access_token']}"
            })
            user_resp.raise_for_status()
            discord_user = user_resp.json()

        discord_email = discord_user.get("email")
        discord_name = discord_user.get("global_name") or discord_user.get("username", "Discord Kullanıcı")
        discord_id = discord_user.get("id")
        discord_avatar = discord_user.get("avatar")

        if not discord_email:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=discord_no_email")

        # Kullanıcıyı bul veya oluştur
        existing = await db.users.find_one({"email": discord_email.lower()})
        if existing:
            user_id = str(existing["_id"])
            # Discord bilgilerini güncelle
            await db.users.update_one({"_id": existing["_id"]}, {"$set": {
                "discord_id": discord_id,
                "discord_avatar": discord_avatar,
            }})
        else:
            result = await db.users.insert_one({
                "email": discord_email.lower(),
                "password_hash": "",
                "name": discord_name,
                "role": "user",
                "email_verified": True,
                "discord_id": discord_id,
                "discord_avatar": discord_avatar,
                "totp_enabled": False,
                "totp_secret": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            user_id = str(result.inserted_id)

        # Kendi JWT token'larını üret
        access = create_access_token(user_id, discord_email.lower())
        refresh = create_refresh_token(user_id)

        await log_login_activity(request, discord_email, True, user_id)

        redirect = RedirectResponse(url=FRONTEND_URL, status_code=302)
        redirect.set_cookie(key="access_token", value=access, httponly=True, secure=False, samesite="lax", max_age=1800, path="/")
        redirect.set_cookie(key="refresh_token", value=refresh, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
        # State cookie'yi temizle
        redirect.delete_cookie("discord_oauth_state", path="/")
        return redirect

    except Exception as e:
        logger.error(f"Discord OAuth error: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=discord_failed")

# --- CoinGecko Proxy ---
@api_router.get("/market-data")
async def get_market_data():
    try:
        async with httpx.AsyncClient(timeout=15.0) as hc:
            resp = await hc.get(f"{COINGECKO_BASE}/coins/markets", params={
                "vs_currency": "usd", "order": "market_cap_desc",
                "per_page": 20, "page": 1, "sparkline": True,
                "price_change_percentage": "1h,24h,7d"
            })
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"CoinGecko market-data error: {e}")
        return []

@api_router.get("/trending")
async def get_trending():
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
    try:
        async with httpx.AsyncClient(timeout=15.0) as hc:
            resp = await hc.get(f"{COINGECKO_BASE}/global")
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"CoinGecko global error: {e}")
        return {"data": {}}

@api_router.get("/")
async def root():
    return {"message": "LENSTEDREAL Quantum Terminal API v10"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.login_logs.create_index("timestamp")
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@lenstedreal.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "LenstedAdmin2026!")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "Admin", "role": "admin", "email_verified": True,
            "totp_enabled": False, "totp_secret": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")

    # Write test credentials
    creds_dir = Path("/app/memory")
    creds_dir.mkdir(exist_ok=True)
    with open(creds_dir / "test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n- POST /api/auth/verify-email\n- POST /api/auth/setup-2fa\n- POST /api/auth/enable-2fa\n- POST /api/auth/verify-2fa-login\n- GET /api/login-logs\n")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
