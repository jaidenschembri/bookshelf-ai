from pathlib import Path
from typing import Set, Optional
import re
import logging

from error_handlers import ValidationError

logger = logging.getLogger(__name__)

class ValidationService:
    """Centralized service for all input validation"""
    
    # File upload constraints
    ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024  # 5MB
    
    # Text constraints
    MAX_USERNAME_LENGTH = 30
    MIN_USERNAME_LENGTH = 3
    MAX_BIO_LENGTH = 500
    MAX_NAME_LENGTH = 100
    MAX_LOCATION_LENGTH = 100
    
    def validate_file_upload(
        self, 
        filename: str, 
        file_content: bytes, 
        allowed_extensions: Optional[Set[str]] = None,
        max_size: Optional[int] = None
    ) -> str:
        """
        Validate file upload parameters
        
        Args:
            filename: The original filename
            file_content: The file content as bytes
            allowed_extensions: Set of allowed file extensions (default: image extensions)
            max_size: Maximum file size in bytes (default: 5MB)
            
        Returns:
            The validated file extension
            
        Raises:
            ValidationError: If validation fails
        """
        if not filename:
            raise ValidationError("Filename is required")
        
        # Get file extension
        file_extension = Path(filename).suffix.lower()
        
        # Use default values if not provided
        if allowed_extensions is None:
            allowed_extensions = self.ALLOWED_IMAGE_EXTENSIONS
        if max_size is None:
            max_size = self.MAX_PROFILE_PICTURE_SIZE
        
        # Validate file type
        if file_extension not in allowed_extensions:
            raise ValidationError(
                f"Invalid file type '{file_extension}'. "
                f"Allowed types: {', '.join(sorted(allowed_extensions))}"
            )
        
        # Validate file size
        if len(file_content) > max_size:
            max_size_mb = max_size // (1024 * 1024)
            raise ValidationError(f"File too large. Maximum size: {max_size_mb}MB")
        
        if len(file_content) == 0:
            raise ValidationError("File is empty")
        
        logger.debug(f"File validation passed: {filename} ({len(file_content)} bytes)")
        return file_extension
    
    def validate_username(self, username: str) -> str:
        """
        Validate username format and constraints
        
        Args:
            username: The username to validate
            
        Returns:
            The cleaned username
            
        Raises:
            ValidationError: If validation fails
        """
        if not username:
            raise ValidationError("Username is required")
        
        # Remove leading/trailing whitespace
        username = username.strip()
        
        # Check length
        if len(username) < self.MIN_USERNAME_LENGTH:
            raise ValidationError(f"Username must be at least {self.MIN_USERNAME_LENGTH} characters")
        
        if len(username) > self.MAX_USERNAME_LENGTH:
            raise ValidationError(f"Username must be at most {self.MAX_USERNAME_LENGTH} characters")
        
        # Check format (alphanumeric + underscore + hyphen, no spaces)
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            raise ValidationError("Username can only contain letters, numbers, underscores, and hyphens")
        
        # Username cannot start with numbers
        if username[0].isdigit():
            raise ValidationError("Username cannot start with a number")
        
        return username
    
    def validate_email(self, email: str) -> str:
        """
        Validate email format
        
        Args:
            email: The email to validate
            
        Returns:
            The cleaned email
            
        Raises:
            ValidationError: If validation fails
        """
        if not email:
            raise ValidationError("Email is required")
        
        # Remove leading/trailing whitespace and convert to lowercase
        email = email.strip().lower()
        
        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise ValidationError("Invalid email format")
        
        return email
    
    def validate_name(self, name: str) -> str:
        """
        Validate display name
        
        Args:
            name: The name to validate
            
        Returns:
            The cleaned name
            
        Raises:
            ValidationError: If validation fails
        """
        if not name:
            raise ValidationError("Name is required")
        
        # Remove leading/trailing whitespace
        name = name.strip()
        
        if len(name) == 0:
            raise ValidationError("Name cannot be empty")
        
        if len(name) > self.MAX_NAME_LENGTH:
            raise ValidationError(f"Name must be at most {self.MAX_NAME_LENGTH} characters")
        
        return name
    
    def validate_bio(self, bio: Optional[str]) -> Optional[str]:
        """
        Validate user bio
        
        Args:
            bio: The bio to validate (can be None)
            
        Returns:
            The cleaned bio or None
            
        Raises:
            ValidationError: If validation fails
        """
        if bio is None:
            return None
        
        # Remove leading/trailing whitespace
        bio = bio.strip()
        
        # Empty string becomes None
        if len(bio) == 0:
            return None
        
        if len(bio) > self.MAX_BIO_LENGTH:
            raise ValidationError(f"Bio must be at most {self.MAX_BIO_LENGTH} characters")
        
        return bio
    
    def validate_location(self, location: Optional[str]) -> Optional[str]:
        """
        Validate user location
        
        Args:
            location: The location to validate (can be None)
            
        Returns:
            The cleaned location or None
            
        Raises:
            ValidationError: If validation fails
        """
        if location is None:
            return None
        
        # Remove leading/trailing whitespace
        location = location.strip()
        
        # Empty string becomes None
        if len(location) == 0:
            return None
        
        if len(location) > self.MAX_LOCATION_LENGTH:
            raise ValidationError(f"Location must be at most {self.MAX_LOCATION_LENGTH} characters")
        
        return location
    
    def validate_reading_goal(self, reading_goal: int) -> int:
        """
        Validate reading goal
        
        Args:
            reading_goal: The reading goal to validate
            
        Returns:
            The validated reading goal
            
        Raises:
            ValidationError: If validation fails
        """
        if reading_goal < 1:
            raise ValidationError("Reading goal must be at least 1 book")
        
        if reading_goal > 365:
            raise ValidationError("Reading goal cannot exceed 365 books per year")
        
        return reading_goal
    
    def validate_rating(self, rating: Optional[int]) -> Optional[int]:
        """
        Validate book rating
        
        Args:
            rating: The rating to validate (can be None)
            
        Returns:
            The validated rating or None
            
        Raises:
            ValidationError: If validation fails
        """
        if rating is None:
            return None
        
        if not isinstance(rating, int):
            raise ValidationError("Rating must be an integer")
        
        if rating < 1 or rating > 5:
            raise ValidationError("Rating must be between 1 and 5 stars")
        
        return rating

# Global instance
validation_service = ValidationService() 