"""
Email-based authentication routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta

from database import get_db
from models import User
from auth_utils import (
    hash_password, verify_password, create_access_token, verify_token,
    create_verification_token, create_reset_token, validate_email_address,
    send_verification_email, send_password_reset_email, validate_password_strength
)

router = APIRouter(prefix="/auth", tags=["Email Authentication"])
security = HTTPBearer()

# Pydantic models for requests/responses
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    username: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    username: Optional[str]
    email_verified: bool
    auth_provider: str
    created_at: datetime

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Helper function to get current user from token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current user from JWT token"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

@router.post("/signup", response_model=dict)
async def signup(
    signup_data: SignupRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user with email and password"""
    
    # Validate email format
    if not validate_email_address(signup_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address format"
        )
    
    # Validate password strength
    is_strong, message = validate_password_strength(signup_data.password)
    if not is_strong:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == signup_data.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username is taken (if provided)
    if signup_data.username:
        result = await db.execute(select(User).where(User.username == signup_data.username))
        existing_username = result.scalar_one_or_none()
        
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Create new user
    hashed_password = hash_password(signup_data.password)
    verification_token = create_verification_token(signup_data.email)
    
    new_user = User(
        email=signup_data.email,
        name=signup_data.name,
        username=signup_data.username,
        password_hash=hashed_password,
        auth_provider="email",
        email_verified=False,
        email_verification_token=verification_token
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Send verification email in background
    background_tasks.add_task(
        send_verification_email,
        signup_data.email,
        verification_token
    )
    
    return {
        "message": "Account created successfully! Please check your email to verify your account.",
        "user_id": new_user.id
    }

@router.post("/login", response_model=AuthResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Login with email and password"""
    
    # Find user by email
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            username=user.username,
            email_verified=user.email_verified,
            auth_provider=user.auth_provider,
            created_at=user.created_at
        )
    )

@router.post("/verify-email")
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """Verify user's email address"""
    
    payload = verify_token(token)
    if not payload or payload.get("type") != "email_verification":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    email = payload.get("email")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.email_verified:
        return {"message": "Email already verified"}
    
    # Mark email as verified
    user.email_verified = True
    user.email_verification_token = None
    await db.commit()
    
    return {"message": "Email verified successfully!"}

@router.post("/forgot-password")
async def forgot_password(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Request password reset"""
    
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If an account with that email exists, a password reset link has been sent."}
    
    # Generate reset token
    reset_token = create_reset_token(request.email)
    user.password_reset_token = reset_token
    user.password_reset_expires = datetime.utcnow() + timedelta(minutes=15)
    
    await db.commit()
    
    # Send reset email in background
    background_tasks.add_task(
        send_password_reset_email,
        request.email,
        reset_token
    )
    
    return {"message": "If an account with that email exists, a password reset link has been sent."}

@router.post("/reset-password")
async def reset_password(
    request: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """Reset password with token"""
    
    payload = verify_token(request.token)
    if not payload or payload.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    email = payload.get("email")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if token matches and hasn't expired
    if (user.password_reset_token != request.token or 
        user.password_reset_expires < datetime.utcnow()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Validate new password
    is_strong, message = validate_password_strength(request.new_password)
    if not is_strong:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Update password
    user.password_hash = hash_password(request.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    
    await db.commit()
    
    return {"message": "Password reset successfully!"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        username=current_user.username,
        email_verified=current_user.email_verified,
        auth_provider=current_user.auth_provider,
        created_at=current_user.created_at
    )

@router.post("/resend-verification")
async def resend_verification_email(
    email: EmailStr,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Resend email verification"""
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.email_verified:
        return {"message": "Email is already verified"}
    
    # Generate new verification token
    verification_token = create_verification_token(email)
    user.email_verification_token = verification_token
    await db.commit()
    
    # Send verification email
    background_tasks.add_task(
        send_verification_email,
        email,
        verification_token
    )
    
    return {"message": "Verification email sent!"} 