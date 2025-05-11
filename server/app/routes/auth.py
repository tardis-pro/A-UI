from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from ..core.auth import (
    Token,
    create_access_token,
    get_current_active_user,
    get_password_hash,
    verify_password,
)
from ..config import get_settings

settings = get_settings()
router = APIRouter(prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Token:
    """Generate JWT token for authenticated user"""
    # TODO: Replace with actual user authentication
    # user = authenticate_user(form_data.username, form_data.password)
    # if not user:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Incorrect username or password",
    #         headers={"WWW-Authenticate": "Bearer"},
    #     )
    
    # For demo, accept any credentials
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, 
        expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")

@router.post("/register")
async def register_user(username: str, password: str):
    """Register new user"""
    # TODO: Add proper user registration
    # Check if user exists
    # if await get_user(username):
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Username already registered"
    #     )
    
    # Hash password
    hashed_password = get_password_hash(password)
    
    # Create user
    # user = await create_user(username=username, hashed_password=hashed_password)
    
    return {"message": "User registered successfully"}

@router.get("/me")
async def read_users_me(current_user = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user