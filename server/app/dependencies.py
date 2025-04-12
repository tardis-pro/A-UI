from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .db.session import get_db

settings = get_settings()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# Re-export get_db for convenience
get_db = get_db

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency to get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # TODO: Implement JWT token validation and user retrieval
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # TODO: Get user from database
    # For now, return the username
    return {"username": username}

# Add more dependencies as needed for:
# - Database sessions
# - Redis connections
# - Vector store connections
# - Ollama client 