from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from database import get_db
from models import User
from schemas import UserResponse, UserUpdate, UserPublicProfile, ReadingResponse
from services import user_service, storage_service, validation_service
from routers.auth import get_current_user
from error_handlers import handle_storage_error, ValidationError, StorageError
from utils import logger

router = APIRouter()

@router.get("/search", response_model=List[UserPublicProfile])
async def search_users(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search for users by name or username"""
    return await user_service.search_users(q, current_user.id, db, limit)

@router.get("/{user_id}", response_model=UserPublicProfile)
async def get_user_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a user's public profile"""
    profile = await user_service.get_user_public_profile(user_id, current_user.id, db)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return profile

@router.get("/{user_id}/library", response_model=List[ReadingResponse])
async def get_user_library(
    user_id: int,
    status: Optional[str] = Query(None, description="Filter by reading status"),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a user's reading library"""
    from services import reading_service
    from schemas import ReadingStatus
    
    # Convert status string to enum if provided
    status_filter = None
    if status:
        try:
            status_filter = ReadingStatus(status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status filter"
            )
    
    readings = await reading_service.get_user_readings(user_id, status_filter, db, limit)
    return await reading_service.create_reading_responses(readings, current_user.id, db)

@router.get("/{user_id}/reviews", response_model=List[ReadingResponse])
async def get_user_reviews(
    user_id: int,
    limit: int = Query(20, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a user's public reviews"""
    return await user_service.get_user_reviews(user_id, current_user.id, db, limit)

@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile"""
    # Validate and clean input data using validation service
    update_data = user_data.dict(exclude_unset=True)
    
    # Apply validation service to each field
    if 'username' in update_data:
        update_data['username'] = validation_service.validate_username(update_data['username'])
    if 'name' in update_data:
        update_data['name'] = validation_service.validate_name(update_data['name'])
    if 'bio' in update_data:
        update_data['bio'] = validation_service.validate_bio(update_data['bio'])
    if 'location' in update_data:
        update_data['location'] = validation_service.validate_location(update_data['location'])
    if 'reading_goal' in update_data:
        update_data['reading_goal'] = validation_service.validate_reading_goal(update_data['reading_goal'])
    
    # Create validated UserUpdate object
    validated_update = UserUpdate(**update_data)
    
    # Update using user service
    updated_user = await user_service.update_user_profile(current_user.id, validated_update, db)
    
    return updated_user

@router.post("/me/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a new profile picture for the current user"""
    
    # Read file content
    content = await file.read()
    
    # Validate file upload
    file_extension = validation_service.validate_file_upload(
        filename=file.filename,
        file_content=content
    )
    
    try:
        # Delete old profile picture if it exists
        if current_user.profile_picture_url:
            await storage_service.delete_profile_picture_from_url(current_user.profile_picture_url)
        
        # Upload new profile picture
        public_url = await storage_service.upload_profile_picture(
            file_content=content,
            user_id=current_user.id,
            file_extension=file_extension
        )
        
        # Update user's profile picture URL using user service
        await user_service.update_profile_picture(current_user.id, public_url, db)
        
        logger.info(f"Profile picture uploaded for user {current_user.id}")
        
        return {
            "message": "Profile picture uploaded successfully",
            "profile_picture_url": public_url
        }
        
    except ValidationError:
        raise  # Re-raise validation errors as-is
    except StorageError:
        raise  # Re-raise storage errors as-is
    except Exception as e:
        # Convert any unexpected exceptions to storage errors
        raise handle_storage_error(e, "profile picture upload") 