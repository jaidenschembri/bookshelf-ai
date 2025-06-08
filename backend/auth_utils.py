"""
Authentication utilities for email-based login system
"""

import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import JWTError, jwt
from email_validator import validate_email, EmailNotValidError
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from utils import logger

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
RESET_TOKEN_EXPIRE_MINUTES = 15

# Brevo (Sendinblue) Email settings
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@yourdomain.com")
FROM_NAME = os.getenv("FROM_NAME", "Bookshelf AI")

def get_brevo_configuration():
    """Get Brevo API configuration with fresh API key"""
    brevo_api_key = os.getenv("BREVO_API_KEY")
    if not brevo_api_key:
        raise ValueError("BREVO_API_KEY environment variable is not set")
    
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = brevo_api_key
    return configuration

def hash_password(password: str) -> str:
    """Hash a password for storing in database"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def create_verification_token(email: str) -> str:
    """Create a token for email verification"""
    data = {
        "email": email,
        "type": "email_verification",
        "exp": datetime.utcnow() + timedelta(hours=24)  # 24 hour expiry
    }
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def create_reset_token(email: str) -> str:
    """Create a token for password reset"""
    data = {
        "email": email,
        "type": "password_reset",
        "exp": datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    }
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def validate_email_address(email: str) -> bool:
    """Validate email address format"""
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        return False

def generate_secure_code() -> str:
    """Generate a secure 6-digit verification code"""
    return str(secrets.randbelow(900000) + 100000)

async def send_verification_email(email: str, verification_token: str, app_url: str = "http://localhost:3000"):
    """Send email verification email using Brevo"""
    verification_url = f"{app_url}/verify-email?token={verification_token}"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Bookshelf AI! 📚</h2>
        <p>Thanks for signing up! Please verify your email address to get started.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verification_url}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email Address
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{verification_url}">{verification_url}</a>
        </p>
        
        <p style="color: #666; font-size: 12px;">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
    </div>
    """
    
    try:
        # Create Brevo API instance with fresh configuration
        configuration = get_brevo_configuration()
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        
        # Create email object
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": email}],
            sender={"name": FROM_NAME, "email": FROM_EMAIL},
            subject="Verify your Bookshelf AI account",
            html_content=html_content
        )
        
        # Send email
        api_response = api_instance.send_transac_email(send_smtp_email)
        logger.info(f"✅ Verification email sent successfully! Message ID: {api_response.message_id}")
        return True
        
    except ApiException as e:
        logger.error(f"❌ Failed to send verification email: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error sending verification email: {e}")
        return False

async def send_password_reset_email(email: str, reset_token: str, app_url: str = "http://localhost:3000"):
    """Send password reset email using Brevo"""
    reset_url = f"{app_url}/reset-password?token={reset_token}"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password 🔐</h2>
        <p>You requested to reset your password for your Bookshelf AI account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_url}" 
               style="background-color: #DC2626; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{reset_url}">{reset_url}</a>
        </p>
        
        <p style="color: #666; font-size: 12px;">
            This link will expire in 15 minutes. If you didn't request a password reset, you can safely ignore this email.
        </p>
    </div>
    """
    
    try:
        # Create Brevo API instance with fresh configuration
        configuration = get_brevo_configuration()
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        
        # Create email object
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": email}],
            sender={"name": FROM_NAME, "email": FROM_EMAIL},
            subject="Reset your Bookshelf AI password",
            html_content=html_content
        )
        
        # Send email
        api_response = api_instance.send_transac_email(send_smtp_email)
        logger.info(f"✅ Password reset email sent successfully! Message ID: {api_response.message_id}")
        return True
        
    except ApiException as e:
        logger.error(f"❌ Failed to send password reset email: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error sending password reset email: {e}")
        return False

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password meets security requirements"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    
    return True, "Password is strong" 