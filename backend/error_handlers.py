from fastapi import HTTPException, status
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class BookshelfError(Exception):
    """Base exception for all application errors"""
    def __init__(self, message: str, status_code: int = 500, details: Optional[str] = None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)

class StorageError(BookshelfError):
    """Storage service errors (Supabase, file uploads, etc.)"""
    def __init__(self, message: str = "Storage service error", details: Optional[str] = None):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR, details)

class DatabaseError(BookshelfError):
    """Database operation errors"""
    def __init__(self, message: str = "Database service error", details: Optional[str] = None):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR, details)

class AuthenticationError(BookshelfError):
    """Authentication and authorization errors"""
    def __init__(self, message: str = "Authentication failed", details: Optional[str] = None):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, details)

class ValidationError(BookshelfError):
    """Input validation errors"""
    def __init__(self, message: str = "Invalid input", details: Optional[str] = None):
        super().__init__(message, status.HTTP_400_BAD_REQUEST, details)

class ExternalAPIError(BookshelfError):
    """External API errors (DeepSeek, Open Library, etc.)"""
    def __init__(self, message: str = "External service unavailable", details: Optional[str] = None):
        super().__init__(message, status.HTTP_502_BAD_GATEWAY, details)

# Error Handlers
def handle_storage_error(e: Exception, context: str = "storage operation") -> HTTPException:
    """Handle storage-related errors"""
    error_msg = f"Storage error during {context}: {str(e)}"
    logger.error(error_msg)
    
    if "Bucket not found" in str(e):
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Storage bucket not configured properly"
        )
    elif "Unauthorized" in str(e) or "403" in str(e):
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Storage service authentication failed"
        )
    elif "network" in str(e).lower() or "connection" in str(e).lower():
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Storage service temporarily unavailable"
        )
    else:
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Storage service error"
        )

def handle_database_error(e: Exception, context: str = "database operation") -> HTTPException:
    """Handle database-related errors"""
    error_msg = f"Database error during {context}: {str(e)}"
    logger.error(error_msg)
    
    if "connection" in str(e).lower() or "timeout" in str(e).lower():
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )
    elif "duplicate" in str(e).lower() or "unique" in str(e).lower():
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Resource already exists"
        )
    else:
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database service error"
        )

def handle_auth_error(e: Exception, context: str = "authentication") -> HTTPException:
    """Handle authentication-related errors"""
    error_msg = f"Auth error during {context}: {str(e)}"
    logger.error(error_msg)
    
    if "token" in str(e).lower() or "jwt" in str(e).lower():
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    elif "unauthorized" in str(e).lower():
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    else:
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

def handle_validation_error(e: Exception, context: str = "input validation") -> HTTPException:
    """Handle validation-related errors"""
    error_msg = f"Validation error during {context}: {str(e)}"
    logger.error(error_msg)
    
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Invalid input: {str(e)}"
    )

def handle_external_api_error(e: Exception, service: str = "external service") -> HTTPException:
    """Handle external API errors"""
    error_msg = f"External API error with {service}: {str(e)}"
    logger.error(error_msg)
    
    if "timeout" in str(e).lower():
        return HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"{service} request timed out"
        )
    elif "429" in str(e) or "rate limit" in str(e).lower():
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"{service} rate limit exceeded"
        )
    else:
        return HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"{service} temporarily unavailable"
        )

def handle_generic_error(e: Exception, context: str = "operation") -> HTTPException:
    """Handle any unspecified errors"""
    error_msg = f"Unexpected error during {context}: {str(e)}"
    logger.error(error_msg)
    
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred"
    )

# Decorator for automatic error handling
def handle_errors(context: str = "operation"):
    """Decorator to automatically handle common errors"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except StorageError as e:
                raise handle_storage_error(e, context)
            except DatabaseError as e:
                raise handle_database_error(e, context)
            except AuthenticationError as e:
                raise handle_auth_error(e, context)
            except ValidationError as e:
                raise handle_validation_error(e, context)
            except ExternalAPIError as e:
                raise handle_external_api_error(e, context)
            except Exception as e:
                raise handle_generic_error(e, context)
        return wrapper
    return decorator 