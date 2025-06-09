import os
import uuid
import httpx
from pathlib import Path
from typing import Optional, Dict, Any
import logging

from error_handlers import StorageError

logger = logging.getLogger(__name__)

class StorageService:
    """Centralized service for all file storage operations (Supabase)"""
    
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "").replace("/rest/v1", "")
        self.service_key = os.getenv("SUPABASE_SERVICE_KEY", "")
        self.is_configured = bool(self.supabase_url and self.service_key)
        
        if not self.is_configured:
            logger.warning("Supabase storage not configured - storage operations will be disabled")
    
    def _check_configuration(self):
        """Check if storage is properly configured"""
        if not self.is_configured:
            raise StorageError("Supabase storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.")
    
    async def upload_file(
        self, 
        file_content: bytes, 
        bucket: str, 
        filename: str,
        content_type: str = "application/octet-stream"
    ) -> str:
        """
        Upload a file to Supabase storage
        
        Args:
            file_content: The file content as bytes
            bucket: The storage bucket name
            filename: The filename to store as
            content_type: MIME type of the file
            
        Returns:
            Public URL of the uploaded file
            
        Raises:
            StorageError: If upload fails or not configured
        """
        self._check_configuration()
        
        upload_url = f"{self.supabase_url}/storage/v1/object/{bucket}/{filename}"
        
        headers = {
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": content_type
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    upload_url,
                    content=file_content,
                    headers=headers
                )
                
                if response.status_code not in [200, 201]:
                    error_details = f"{response.status_code} - {response.text}"
                    raise StorageError(f"File upload failed: {error_details}")
            
            # Return public URL
            public_url = f"{self.supabase_url}/storage/v1/object/public/{bucket}/{filename}"
            logger.info(f"File uploaded successfully: {filename} -> {public_url}")
            return public_url
            
        except httpx.RequestError as e:
            raise StorageError(f"Network error during upload: {str(e)}")
        except Exception as e:
            if isinstance(e, StorageError):
                raise
            raise StorageError(f"Unexpected error during upload: {str(e)}")
    
    async def delete_file(self, bucket: str, filename: str) -> bool:
        """
        Delete a file from Supabase storage
        
        Args:
            bucket: The storage bucket name
            filename: The filename to delete
            
        Returns:
            True if deletion successful, False otherwise
        """
        if not self.is_configured:
            logger.warning("Storage not configured - skipping file deletion")
            return False
            
        delete_url = f"{self.supabase_url}/storage/v1/object/{bucket}/{filename}"
        
        headers = {
            "Authorization": f"Bearer {self.service_key}"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(delete_url, headers=headers)
                
                if response.status_code in [200, 204]:
                    logger.info(f"File deleted successfully: {filename}")
                    return True
                else:
                    logger.warning(f"Failed to delete file {filename}: {response.status_code}")
                    return False
                    
        except httpx.RequestError as e:
            logger.error(f"Network error during file deletion: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during file deletion: {e}")
            return False
    
    async def upload_profile_picture(
        self, 
        file_content: bytes, 
        user_id: int, 
        file_extension: str
    ) -> str:
        """
        Upload a profile picture for a user
        
        Args:
            file_content: The image file content
            user_id: The user's ID
            file_extension: The file extension (e.g., '.jpg')
            
        Returns:
            Public URL of the uploaded profile picture
        """
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"user_{user_id}_{file_id}{file_extension}"
        
        return await self.upload_file(
            file_content=file_content,
            bucket="profile-pictures",
            filename=filename,
            content_type=self._get_content_type_from_extension(file_extension)
        )
    
    async def delete_profile_picture_from_url(self, profile_picture_url: str) -> bool:
        """
        Delete a profile picture using its public URL
        
        Args:
            profile_picture_url: The public URL of the profile picture
            
        Returns:
            True if deletion successful, False otherwise
        """
        if not profile_picture_url or "supabase" not in profile_picture_url:
            return False
        
        try:
            # Extract filename from URL
            filename = profile_picture_url.split("/")[-1]
            return await self.delete_file("profile-pictures", filename)
        except Exception as e:
            logger.warning(f"Failed to extract filename from URL {profile_picture_url}: {e}")
            return False
    
    def _get_content_type_from_extension(self, extension: str) -> str:
        """Get appropriate MIME type from file extension"""
        content_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg", 
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp"
        }
        return content_types.get(extension.lower(), "application/octet-stream")
    
    async def get_upload_info(self, bucket: str) -> Dict[str, Any]:
        """
        Get information about a storage bucket
        
        Args:
            bucket: The bucket name
            
        Returns:
            Dictionary with bucket information
        """
        self._check_configuration()
        
        info_url = f"{self.supabase_url}/storage/v1/bucket/{bucket}"
        
        headers = {
            "Authorization": f"Bearer {self.service_key}"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(info_url, headers=headers)
                
                if response.status_code == 200:
                    return response.json()
                else:
                    raise StorageError(f"Failed to get bucket info: {response.status_code}")
                    
        except httpx.RequestError as e:
            raise StorageError(f"Network error getting bucket info: {str(e)}")
        except Exception as e:
            if isinstance(e, StorageError):
                raise
            raise StorageError(f"Unexpected error getting bucket info: {str(e)}")

# Global instance - can be imported and used anywhere
storage_service = StorageService() 