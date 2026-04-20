from passlib.context import CryptContext
from jose import JWTError , jwt
from datetime import datetime , timedelta
from fastapi import Depends , HTTPException
from app.database import get_db
from sqlalchemy.orm import Session
from app import models
from fastapi.security import OAuth2PasswordBearer
import os 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"] , deprecated = "auto" , bcrypt__truncate_error = False)

# Hash password
def hash_password(password : str):
    return pwd_context.hash(password[:72])

# Verify password
def verify_password(plain , hashed):
    return pwd_context.verify(plain[:72] , hashed)

# Create jwt token
def create_access_token(data : dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=1)
    to_encode.update({"exp" : expire})
    return jwt.encode(to_encode , SECRET_KEY , algorithm=ALGORITHM)

def get_current_user(token : str = Depends(oauth2_scheme), db : Session = Depends(get_db)):
    try:
        payload = jwt.decode(token , SECRET_KEY , algorithms=[ALGORITHM])
        email =   payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401 , detail="Invalid token")
    
    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        raise HTTPException(status_code=401 , detail="User not found")
    
    return user
