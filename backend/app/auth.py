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
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest).decode("utf-8")  # Always 44 chars

def hash_password(password: str) -> str:
    return pwd_context.hash(_prepare_password(password))

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(_prepare_password(plain), hashed)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=1)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user