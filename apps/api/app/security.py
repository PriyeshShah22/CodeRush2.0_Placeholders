from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import secrets
import jwt
from fastapi import Depends, HTTPException, Request, status
from pwdlib import PasswordHash
from sqlalchemy.orm import Session
from .config import settings
from .db import get_db
from .models import Role, User

password_hash = PasswordHash.recommended()

def hash_password(value: str) -> str: return password_hash.hash(value)
def verify_password(value: str, hashed: str) -> bool: return password_hash.verify(value, hashed)
def hash_pin(pin: str) -> str: return hashlib.sha256((pin+settings.jwt_secret).encode()).hexdigest()
def verify_pin(pin: str, hashed: str) -> bool: return hmac.compare_digest(hash_pin(pin), hashed)
def pin_for_idempotency(key: str) -> str:
    digest=hmac.new(settings.jwt_secret.encode(),key.encode(),hashlib.sha256).digest()
    return f"{int.from_bytes(digest[:4],'big')%10000:04d}"

def create_token(user: User, kind: str, minutes: int) -> str:
    now=datetime.now(timezone.utc)
    return jwt.encode({"sub":user.id,"role":user.role.value,"kind":kind,"iat":now,"exp":now+timedelta(minutes=minutes),"jti":secrets.token_urlsafe(16)}, settings.jwt_secret, algorithm="HS256")

def current_user(request: Request, db: Session=Depends(get_db)) -> User:
    token=request.cookies.get("nivaran_access")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload=jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        if payload.get("kind") != "access": raise ValueError()
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    user=db.get(User,payload["sub"])
    if not user or not user.is_active: raise HTTPException(status_code=401, detail="Account unavailable")
    return user

def optional_current_user(request: Request, db: Session=Depends(get_db)) -> User | None:
    token=request.cookies.get("nivaran_access")
    if not token: return None
    try:
        payload=jwt.decode(token,settings.jwt_secret,algorithms=["HS256"])
        if payload.get("kind")!="access": return None
    except Exception:
        return None
    user=db.get(User,payload["sub"])
    return user if user and user.is_active else None

def require_roles(*roles: Role):
    def dependency(user: User=Depends(current_user)):
        if user.role not in roles: raise HTTPException(status_code=403, detail="You do not have permission for this action")
        return user
    return dependency
