from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
import os
import uuid
from pathlib import Path
import httpx
import base64

from database import get_db
from models import User, UserFollow, Reading, Book
from schemas import (
    UserPublicProfile, UserUpdate, UserResponse, ReadingResponse
)
from routers.auth import get_current_user
from utils import parse_user_id, log_api_error, logger

router = APIRouter()

# Supabase Storage configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "").replace("/rest/v1", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")  # Use service key for backend operations
SUPABASE_BUCKET = "profile-pictures"  # Match the actual bucket name in Supabase

# Allowed image extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

async def upload_to_supabase_storage(file_content: bytes, filename: str) -> str:
    """Upload file to Supabase Storage and return public URL"""
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase configuration missing"
        )
    
    # Supabase Storage API endpoint
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{filename}"
    
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/octet-stream"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            upload_url,
            content=file_content,
            headers=headers
        )
        
        if response.status_code not in [200, 201]:
            logger.error(f"Supabase upload failed: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload to cloud storage"
            )
    
    # Return public URL
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{filename}"
    return public_url

async def delete_from_supabase_storage(filename: str):
    """Delete file from Supabase Storage"""
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return  # Skip deletion if not configured
    
    delete_url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{filename}"
    
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(delete_url, headers=headers)
        if response.status_code not in [200, 204]:
            logger.warning(f"Failed to delete old profile picture: {response.status_code}")

@router.get("/search", response_model=List[UserPublicProfile])
async def search_users(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search for users by name or username"""
    # Search users by name or username
    result = await db.execute(
        select(User).where(
            and_(
                User.is_active == True,
                or_(
                    User.name.ilike(f"%{q}%"),
                    User.username.ilike(f"%{q}%")
                )
            )
        ).limit(limit)
    )
    users = result.scalars().all()
    
    # Build public profiles with follow status
    profiles = []
    for user in users:
        # Check if current user is following this user
        is_following_result = await db.execute(
            select(UserFollow).where(
                and_(
                    UserFollow.follower_id == current_user.id,
                    UserFollow.following_id == user.id
                )
            )
        )
        is_following = is_following_result.scalar_one_or_none() is not None
        
        # Get follower counts
        follower_count_result = await db.execute(
            select(func.count(UserFollow.id)).where(UserFollow.following_id == user.id)
        )
        follower_count = follower_count_result.scalar() or 0
        
        following_count_result = await db.execute(
            select(func.count(UserFollow.id)).where(UserFollow.follower_id == user.id)
        )
        following_count = following_count_result.scalar() or 0
        
        profile = UserPublicProfile(
            id=user.id,
            name=user.name,
            username=user.username,
            bio=user.bio,
            location=user.location,
            profile_picture_url=user.profile_picture_url,
            reading_goal=user.reading_goal,
            is_private=user.is_private,
            created_at=user.created_at,
            follower_count=follower_count,
            following_count=following_count,
            is_following=is_following
        )
        profiles.append(profile)
    
    return profiles

@router.get("/{user_id}", response_model=UserPublicProfile)
async def get_user_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a user's public profile"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if current user is following this user
    is_following_result = await db.execute(
        select(UserFollow).where(
            and_(
                UserFollow.follower_id == current_user.id,
                UserFollow.following_id == user.id
            )
        )
    )
    is_following = is_following_result.scalar_one_or_none() is not None
    
    # Get follower counts
    follower_count_result = await db.execute(
        select(func.count(UserFollow.id)).where(UserFollow.following_id == user.id)
    )
    follower_count = follower_count_result.scalar() or 0
    
    following_count_result = await db.execute(
        select(func.count(UserFollow.id)).where(UserFollow.follower_id == user.id)
    )
    following_count = following_count_result.scalar() or 0
    
    return UserPublicProfile(
        id=user.id,
        name=user.name,
        username=user.username,
        bio=user.bio,
        location=user.location,
        profile_picture_url=user.profile_picture_url,
        reading_goal=user.reading_goal,
        is_private=user.is_private,
        created_at=user.created_at,
        follower_count=follower_count,
        following_count=following_count,
        is_following=is_following
    )

@router.get("/{user_id}/library", response_model=List[ReadingResponse])
async def get_user_library(
    user_id: int,
    status: Optional[str] = Query(None, description="Filter by reading status"),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a user's reading library"""
    # Check if user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check privacy - if private and not following, only show public reviews
    can_view_private = user_id == current_user.id
    if user.is_private and user_id != current_user.id:
        # Check if current user follows this user
        follow_result = await db.execute(
            select(UserFollow).where(
                and_(
                    UserFollow.follower_id == current_user.id,
                    UserFollow.following_id == user_id
                )
            )
        )
        can_view_private = follow_result.scalar_one_or_none() is not None
    
    # Build query
    query = select(Reading).options(
        selectinload(Reading.book),
        selectinload(Reading.user)
    ).where(Reading.user_id == user_id)
    
    # Filter by status if provided
    if status:
        query = query.where(Reading.status == status)
    
    # If can't view private, only show public reviews or readings without reviews
    if not can_view_private:
        query = query.where(
            or_(
                Reading.is_review_public == True,
                Reading.review.is_(None)
            )
        )
    
    query = query.order_by(desc(Reading.updated_at)).limit(limit)
    
    result = await db.execute(query)
    readings = result.scalars().all()
    
    # Enhance readings with interaction data
    enhanced_readings = []
    for reading in readings:
        # Get like count (only for public reviews)
        like_count = 0
        comment_count = 0
        is_liked = False
        
        if reading.review and reading.is_review_public:
            from models import ReviewLike, ReviewComment
            
            like_count_result = await db.execute(
                select(func.count(ReviewLike.id)).where(ReviewLike.reading_id == reading.id)
            )
            like_count = like_count_result.scalar() or 0
            
            comment_count_result = await db.execute(
                select(func.count(ReviewComment.id)).where(ReviewComment.reading_id == reading.id)
            )
            comment_count = comment_count_result.scalar() or 0
            
            # Check if current user liked this review
            is_liked_result = await db.execute(
                select(ReviewLike).where(
                    and_(
                        ReviewLike.reading_id == reading.id,
                        ReviewLike.user_id == current_user.id
                    )
                )
            )
            is_liked = is_liked_result.scalar_one_or_none() is not None
        
        reading_response = ReadingResponse(
            id=reading.id,
            user_id=reading.user_id,
            book_id=reading.book_id,
            status=reading.status,
            rating=reading.rating,
            review=reading.review if (can_view_private or reading.is_review_public) else None,
            is_review_public=reading.is_review_public,
            progress_pages=reading.progress_pages,
            total_pages=reading.total_pages,
            started_at=reading.started_at,
            finished_at=reading.finished_at,
            created_at=reading.created_at,
            updated_at=reading.updated_at,
            book=reading.book,
            user=UserPublicProfile(
                id=reading.user.id,
                name=reading.user.name,
                username=reading.user.username,
                bio=reading.user.bio,
                location=reading.user.location,
                profile_picture_url=reading.user.profile_picture_url,
                reading_goal=reading.user.reading_goal,
                is_private=reading.user.is_private,
                created_at=reading.user.created_at,
                follower_count=0,  # Could be optimized
                following_count=0,  # Could be optimized
                is_following=user_id != current_user.id  # Not following yourself
            ),
            like_count=like_count,
            comment_count=comment_count,
            is_liked=is_liked
        )
        enhanced_readings.append(reading_response)
    
    return enhanced_readings

@router.get("/{user_id}/reviews", response_model=List[ReadingResponse])
async def get_user_reviews(
    user_id: int,
    limit: int = Query(20, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a user's public reviews"""
    # Check if user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get public reviews only
    result = await db.execute(
        select(Reading)
        .options(
            selectinload(Reading.book),
            selectinload(Reading.user)
        )
        .where(
            and_(
                Reading.user_id == user_id,
                Reading.is_review_public == True,
                Reading.review.isnot(None)
            )
        )
        .order_by(desc(Reading.updated_at))
        .limit(limit)
    )
    readings = result.scalars().all()
    
    # Enhance with interaction data
    enhanced_readings = []
    for reading in readings:
        from models import ReviewLike, ReviewComment
        
        # Get like count
        like_count_result = await db.execute(
            select(func.count(ReviewLike.id)).where(ReviewLike.reading_id == reading.id)
        )
        like_count = like_count_result.scalar() or 0
        
        # Get comment count
        comment_count_result = await db.execute(
            select(func.count(ReviewComment.id)).where(ReviewComment.reading_id == reading.id)
        )
        comment_count = comment_count_result.scalar() or 0
        
        # Check if current user liked this review
        is_liked_result = await db.execute(
            select(ReviewLike).where(
                and_(
                    ReviewLike.reading_id == reading.id,
                    ReviewLike.user_id == current_user.id
                )
            )
        )
        is_liked = is_liked_result.scalar_one_or_none() is not None
        
        reading_response = ReadingResponse(
            id=reading.id,
            user_id=reading.user_id,
            book_id=reading.book_id,
            status=reading.status,
            rating=reading.rating,
            review=reading.review,
            is_review_public=reading.is_review_public,
            progress_pages=reading.progress_pages,
            total_pages=reading.total_pages,
            started_at=reading.started_at,
            finished_at=reading.finished_at,
            created_at=reading.created_at,
            updated_at=reading.updated_at,
            book=reading.book,
            user=UserPublicProfile(
                id=reading.user.id,
                name=reading.user.name,
                username=reading.user.username,
                bio=reading.user.bio,
                location=reading.user.location,
                profile_picture_url=reading.user.profile_picture_url,
                reading_goal=reading.user.reading_goal,
                is_private=reading.user.is_private,
                created_at=reading.user.created_at,
                follower_count=0,  # Could be optimized
                following_count=0,  # Could be optimized
                is_following=user_id != current_user.id
            ),
            like_count=like_count,
            comment_count=comment_count,
            is_liked=is_liked
        )
        enhanced_readings.append(reading_response)
    
    return enhanced_readings

@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile"""
    # Check if username is taken (if provided and different)
    if user_data.username and user_data.username != current_user.username:
        result = await db.execute(
            select(User).where(
                and_(
                    User.username == user_data.username,
                    User.id != current_user.id
                )
            )
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Update fields
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user

@router.post("/me/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a new profile picture for the current user"""
    
    # Validate file type
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    try:
        # Check Supabase configuration first
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            logger.error(f"Supabase configuration missing: URL={bool(SUPABASE_URL)}, KEY={bool(SUPABASE_SERVICE_KEY)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Storage service not configured"
            )
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"user_{current_user.id}_{file_id}{file_extension}"
        
        logger.info(f"Attempting to upload {filename} for user {current_user.id}")
        
        # Upload to Supabase Storage
        public_url = await upload_to_supabase_storage(content, filename)
        
        logger.info(f"Upload successful, public URL: {public_url}")
        
        # Delete old profile picture if exists and it's from Supabase
        if current_user.profile_picture_url and "supabase" in current_user.profile_picture_url:
            try:
                # Extract filename from old URL
                old_filename = current_user.profile_picture_url.split("/")[-1]
                await delete_from_supabase_storage(old_filename)
            except Exception as e:
                logger.warning(f"Failed to delete old profile picture: {e}")
        
        # Update user's profile picture URL
        current_user.profile_picture_url = public_url
        await db.commit()
        await db.refresh(current_user)
        
        logger.info(f"Profile picture uploaded for user {current_user.id}: {filename}")
        
        return {
            "message": "Profile picture uploaded successfully",
            "profile_picture_url": current_user.profile_picture_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading profile picture for user {current_user.id}: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload profile picture: {str(e)}"
        ) 