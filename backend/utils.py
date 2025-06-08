import secrets
from typing import Optional
import logging
import sys
from datetime import datetime

# Configure logging
def setup_logging():
    """Configure application logging"""
    # Create formatters
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # File handler - logs everything at INFO level
    file_handler = logging.FileHandler('app.log', mode='a')
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    
    # Console handler - only shows warnings and errors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.WARNING)
    console_handler.setFormatter(formatter)
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        handlers=[console_handler, file_handler]
    )
    
    # Set specific loggers
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    return logging.getLogger(__name__)

# Initialize logger
logger = setup_logging()

def convert_user_id(user_id: int) -> int:
    """
    Convert large OAuth user IDs to SQLite-compatible 64-bit signed integers.
    
    This function handles the case where OAuth providers (like Google) return
    very large user IDs that exceed SQLite's INTEGER range.
    
    Args:
        user_id: The original user ID (potentially very large)
        
    Returns:
        A SQLite-compatible user ID (64-bit signed integer)
    """
    # SQLite's INTEGER can handle up to 2^63 - 1
    max_sqlite_int = 2**63 - 1
    
    if user_id <= max_sqlite_int:
        return user_id
    
    # Use modulo to fit within SQLite's range while maintaining uniqueness
    return user_id % (2**63)

def parse_user_id(user_id_str: str) -> int:
    """Parse user ID string to integer, handling potential issues"""
    try:
        return int(user_id_str)
    except (ValueError, TypeError):
        raise ValueError(f"Invalid user ID format: {user_id_str}")

def log_auth_event(event_type: str, user_email: Optional[str] = None, user_id: Optional[int] = None, details: Optional[str] = None):
    """Log authentication events with structured format"""
    log_data = {
        "event": event_type,
        "timestamp": datetime.utcnow().isoformat(),
        "user_email": user_email,
        "user_id": user_id,
        "details": details
    }
    logger.info(f"AUTH_EVENT: {log_data}")

def log_api_error(endpoint: str, error: Exception, user_id: Optional[int] = None):
    """Log API errors with structured format"""
    log_data = {
        "endpoint": endpoint,
        "error_type": type(error).__name__,
        "error_message": str(error),
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat()
    }
    logger.error(f"API_ERROR: {log_data}")

def log_external_api_call(service: str, status_code: int, endpoint: str, success: bool = True):
    """Log external API calls"""
    log_data = {
        "service": service,
        "endpoint": endpoint,
        "status_code": status_code,
        "success": success,
        "timestamp": datetime.utcnow().isoformat()
    }
    logger.info(f"EXTERNAL_API: {log_data}") 