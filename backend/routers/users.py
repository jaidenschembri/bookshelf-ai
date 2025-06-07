from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.sql import operators
from sqlalchemy.orm import selectinload
from typing import List, Optional

from database import get_db
from models import User, UserFollow, Reading, Book
from schemas import (
    UserPublicProfile, UserUpdate, UserResponse, ReadingResponse
)
from routers.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

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