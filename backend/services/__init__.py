# Services package for Bookshelf AI
# This package contains business logic services that can be reused across different routes 

# Global service instances for easy importing across the app
from .storage_service import storage_service
from .validation_service import validation_service
from .book_service import book_service
from .reading_service import reading_service
from .user_service import user_service

__all__ = ["storage_service", "validation_service", "book_service", "reading_service", "user_service"] 