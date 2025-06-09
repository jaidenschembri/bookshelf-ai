from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import os
import jwt
from datetime import datetime, timedelta
import httpx
import asyncio
from pydantic import BaseModel, EmailStr
from typing import Optional

from database import get_db
from models import User
from schemas import GoogleAuthRequest, AuthResponse, UserCreate, UserResponse
from utils import parse_user_id, convert_user_id, log_auth_event, log_api_error, log_external_api_call, logger
from auth_utils import (
    hash_password, verify_password, create_verification_token, 
    validate_email_address, send_verification_email, validate_password_strength
)

router = APIRouter()
security = HTTPBearer()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Unified Pydantic models for both auth methods
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

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token - ALWAYS uses user_id as 'sub' for consistency"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_or_create_user_google(google_user_info: dict, db: AsyncSession) -> User:
    """Get existing user or create new one from Google user info"""
    # Google API v2 returns 'id', Google API v1 might return 'sub'
    google_id = google_user_info.get("id") or google_user_info.get("sub")
    email = google_user_info.get("email")
    name = google_user_info.get("name")
    
    if not google_id or not email or not name:
        log_auth_event("missing_user_info", user_email=email, details=f"google_id={google_id}, email={email}, name={name}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required user information from Google"
        )
    
    log_auth_event("user_lookup_start", user_email=email, details=f"google_id={google_id}")
    
    # Check if user exists by Google ID
    result = await db.execute(select(User).where(User.google_id == str(google_id)))
    user = result.scalar_one_or_none()
    
    if user:
        log_auth_event("existing_user_found", user_email=user.email, user_id=user.id)
        # Update auth provider and last login
        user.auth_provider = "google"
        user.last_login = datetime.utcnow()
        await db.commit()
        await db.refresh(user)
        db.expunge(user)
        return user
    
    # Also check by email in case the user exists but with different google_id
    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        log_auth_event("user_google_id_update", user_email=email, user_id=existing_user.id)
        existing_user.google_id = str(google_id)
        existing_user.name = name  # Update name in case it changed
        existing_user.auth_provider = "google"  # Update auth provider
        existing_user.email_verified = True  # Google emails are verified
        existing_user.last_login = datetime.utcnow()
        await db.commit()
        await db.refresh(existing_user)
        db.expunge(existing_user)
        return existing_user
    
    log_auth_event("new_user_creation_start", user_email=email, details=f"google_id={google_id}")
    
    try:
        # Generate a unique username from name and email
        base_username = name.lower().replace(" ", "").replace(".", "")[:15]
        username = base_username
        counter = 1
        
        # Check if username exists and make it unique
        while True:
            result = await db.execute(select(User).where(User.username == username))
            if not result.scalar_one_or_none():
                break
            username = f"{base_username}{counter}"
            counter += 1
        
        # Create new user
        user = User(
            google_id=str(google_id),
            email=email,
            name=name,
            username=username,
            profile_picture_url=google_user_info.get("picture"),
            email_verified=True,  # Google emails are verified
            auth_provider="google",
            last_login=datetime.utcnow(),
            reading_goal=12,  # Default reading goal
            is_private=False  # Default to public profile
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        log_auth_event("new_user_created", user_email=user.email, user_id=user.id, details=f"google_id={user.google_id}")
        db.expunge(user)
        return user
        
    except Exception as e:
        log_api_error("get_or_create_user_google", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

# UNIFIED get_current_user function - works for both auth methods
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Unified dependency to get current user from JWT token - works for both Google and email auth"""
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            log_auth_event("invalid_token", details="missing_user_id_in_token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    except jwt.PyJWTError as e:
        log_auth_event("jwt_decode_failed", details=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    try:
        # Convert user_id to integer (handles both string and int inputs)
        safe_user_id = parse_user_id(user_id_str)
        log_auth_event("user_lookup_attempt", details=f"user_id={safe_user_id}")
        
        result = await db.execute(select(User).where(User.id == safe_user_id))
        user = result.scalar_one_or_none()
        
        if user is None:
            log_auth_event("user_not_found", details=f"user_id={safe_user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        log_auth_event("user_lookup_success", user_email=user.email, user_id=user.id)
        return user
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        log_api_error("get_current_user", e, user_id=safe_user_id if 'safe_user_id' in locals() else None)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}"
        )

# GOOGLE OAUTH ENDPOINTS
@router.post("/google", response_model=AuthResponse)
async def google_auth(
    auth_request: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db)
):
    """Handle Google OAuth authentication"""
    log_auth_event("google_auth_start", details=f"token_present={bool(auth_request.token)}")
    
    if not auth_request.token:
        log_auth_event("google_auth_failed", details="missing_token")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google access token is required"
        )
    
    try:
        logger.info("Verifying Google token")
        
        # Use Google OAuth2 v2 API to verify token and get user info
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={auth_request.token}"
            )
            
            log_external_api_call("google_oauth", response.status_code, "userinfo", response.status_code == 200)
            
            if response.status_code != 200:
                error_detail = response.text if response.text else "Invalid Google token"
                log_auth_event("google_token_verification_failed", details=error_detail)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Google token verification failed: {error_detail}"
                )
            
            google_user_info = response.json()
            log_auth_event("google_user_info_received", user_email=google_user_info.get('email'))
        
        # Validate required fields
        required_fields = ['id', 'email', 'name']
        missing_fields = [field for field in required_fields if not google_user_info.get(field)]
        
        if missing_fields:
            log_auth_event("google_response_validation_failed", details=f"missing_fields={missing_fields}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required fields from Google: {missing_fields}"
            )
        
        # Get or create user
        user = await get_or_create_user_google(google_user_info, db)
        log_auth_event("user_processed", user_email=user.email, user_id=user.id)
        
        # Create access token with user_id as 'sub' (CONSISTENT)
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        # Manually create UserResponse to avoid async issues
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            username=user.username,
            bio=user.bio,
            location=user.location,
            profile_picture_url=user.profile_picture_url,
            reading_goal=user.reading_goal,
            timezone=user.timezone or "UTC",
            email_verified=user.email_verified,
            last_login=user.last_login,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            is_private=user.is_private or False
        )
        
        response_data = AuthResponse(
            user=user_response,
            access_token=access_token
        )
        log_auth_event("authentication_successful", user_email=user.email, user_id=user.id)
        
        return response_data
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except httpx.TimeoutException:
        log_auth_event("google_token_timeout")
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Timeout verifying Google token"
        )
    except Exception as e:
        log_api_error("google_auth", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

# EMAIL/PASSWORD AUTHENTICATION ENDPOINTS
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
    else:
        # Generate username from name if not provided
        base_username = signup_data.name.lower().replace(" ", "").replace(".", "")[:15]
        username = base_username
        counter = 1
        
        while True:
            result = await db.execute(select(User).where(User.username == username))
            if not result.scalar_one_or_none():
                break
            username = f"{base_username}{counter}"
            counter += 1
        
        signup_data.username = username
    
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
        email_verification_token=verification_token,
        reading_goal=12,
        is_private=False
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
    
    # Update last login and auth provider
    user.last_login = datetime.utcnow()
    user.auth_provider = "email"
    await db.commit()
    
    # Create access token with user_id as 'sub' (CONSISTENT)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    # Manually create UserResponse to avoid async issues
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        username=user.username,
        bio=user.bio,
        location=user.location,
        profile_picture_url=user.profile_picture_url,
        reading_goal=user.reading_goal,
        timezone=user.timezone or "UTC",
        email_verified=user.email_verified,
        last_login=user.last_login,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        is_private=user.is_private or False
    )
    
    return AuthResponse(
        user=user_response,
        access_token=access_token
    )

# COMMON ENDPOINTS
@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information - works for both auth methods"""
    # Manually create UserResponse to avoid async issues
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        username=current_user.username,
        bio=current_user.bio,
        location=current_user.location,
        profile_picture_url=current_user.profile_picture_url,
        reading_goal=current_user.reading_goal,
        timezone=current_user.timezone or "UTC",
        email_verified=current_user.email_verified,
        last_login=current_user.last_login,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        is_private=current_user.is_private or False
    ) 