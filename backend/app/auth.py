from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from app.database import get_db
from sqlalchemy.orm import Session
from app import models
from fastapi.security import OAuth2PasswordBearer
import os
import hashlib
import base64

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def _prepare_password(password: str) -> str:
    """
    SHA-256 hash the password first, then base64 encode it.
    This keeps it safely under 72 bytes for bcrypt.
    """
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest).decode("utf-8")  # Always 44 chars, safe for bcrypt

def hash_password(password: str) -> str:
    return pwd_context.hash(_prepare_password(password))

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(_prepare_password(plain), hashed)