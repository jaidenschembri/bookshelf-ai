from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import User, UserFollow, Reading, ReviewLike, ReviewComment, UserActivity, Book
from schemas import (
    UserFollowCreate, UserFollowResponse, UserPublicProfile,
    ReviewCommentCreate, ReviewCommentUpdate, ReviewCommentResponse,
    ReviewLikeResponse, UserActivityResponse, SocialFeedResponse,
    ReadingResponse
)
from services import user_service
from routers.auth import get_current_user

router = APIRouter(prefix="/social", tags=["social"])

# User Following Endpoints

@router.post("/follow", response_model=UserFollowResponse)
async def follow_user(
    follow_data: UserFollowCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Follow a user"""
    # Use user service to create follow relationship
    new_follow = await user_service.follow_user(current_user.id, follow_data.following_id, db)
    
    # Load relationships for response
    result = await db.execute(
        select(UserFollow)
        .options(selectinload(UserFollow.follower), selectinload(UserFollow.following))
        .where(UserFollow.id == new_follow.id)
    )
    follow_with_relations = result.scalar_one()
    
    return follow_with_relations

@router.delete("/unfollow/{user_id}")
async def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Unfollow a user"""
    await user_service.unfollow_user(current_user.id, user_id, db)
    return {"message": "Successfully unfollowed user"}

@router.get("/followers/{user_id}", response_model=List[UserPublicProfile])
async def get_user_followers(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a user's followers"""
    return await user_service.get_followers(user_id, current_user.id, db)

@router.get("/following/{user_id}", response_model=List[UserPublicProfile])
async def get_user_following(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get users that a user is following"""
    return await user_service.get_following(user_id, current_user.id, db)

# Review Interaction Endpoints

@router.post("/reviews/{reading_id}/like", response_model=ReviewLikeResponse)
async def like_review(
    reading_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Like a review"""
    # Check if reading exists and has a public review
    result = await db.execute(
        select(Reading).where(
            and_(
                Reading.id == reading_id,
                Reading.is_review_public == True,
                Reading.review.isnot(None)
            )
        )
    )
    reading = result.scalar_one_or_none()
    if not reading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found or not public"
        )
    
    # Check if already liked
    result = await db.execute(
        select(ReviewLike).where(
            and_(
                ReviewLike.user_id == current_user.id,
                ReviewLike.reading_id == reading_id
            )
        )
    )
    existing_like = result.scalar_one_or_none()
    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already liked this review"
        )
    
    # Create like
    new_like = ReviewLike(
        user_id=current_user.id,
        reading_id=reading_id
    )
    db.add(new_like)
    await db.commit()
    await db.refresh(new_like)
    
    # Load user for response
    result = await db.execute(
        select(ReviewLike)
        .options(selectinload(ReviewLike.user))
        .where(ReviewLike.id == new_like.id)
    )
    like_with_user = result.scalar_one()
    
    return like_with_user

@router.delete("/reviews/{reading_id}/unlike")
async def unlike_review(
    reading_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Unlike a review"""
    result = await db.execute(
        select(ReviewLike).where(
            and_(
                ReviewLike.user_id == current_user.id,
                ReviewLike.reading_id == reading_id
            )
        )
    )
    like = result.scalar_one_or_none()
    if not like:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Like not found"
        )
    
    await db.delete(like)
    await db.commit()
    
    return {"message": "Successfully unliked review"}

@router.post("/reviews/{reading_id}/comments", response_model=ReviewCommentResponse)
async def add_review_comment(
    reading_id: int,
    comment_data: ReviewCommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a comment to a review"""
    # Check if reading exists and has a public review
    result = await db.execute(
        select(Reading).where(
            and_(
                Reading.id == reading_id,
                Reading.is_review_public == True,
                Reading.review.isnot(None)
            )
        )
    )
    reading = result.scalar_one_or_none()
    if not reading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found or not public"
        )
    
    # Create comment
    new_comment = ReviewComment(
        user_id=current_user.id,
        reading_id=reading_id,
        content=comment_data.content
    )
    db.add(new_comment)
    await db.commit()
    await db.refresh(new_comment)
    
    # Load user for response
    result = await db.execute(
        select(ReviewComment)
        .options(selectinload(ReviewComment.user))
        .where(ReviewComment.id == new_comment.id)
    )
    comment_with_user = result.scalar_one()
    
    return comment_with_user

@router.get("/reviews/{reading_id}/comments", response_model=List[ReviewCommentResponse])
async def get_review_comments(
    reading_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get comments for a review"""
    result = await db.execute(
        select(ReviewComment)
        .options(selectinload(ReviewComment.user))
        .where(ReviewComment.reading_id == reading_id)
        .order_by(ReviewComment.created_at)
    )
    comments = result.scalars().all()
    
    return comments

@router.put("/reviews/comments/{comment_id}", response_model=ReviewCommentResponse)
async def update_review_comment(
    comment_id: int,
    comment_data: ReviewCommentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a review comment"""
    result = await db.execute(
        select(ReviewComment).where(ReviewComment.id == comment_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only edit your own comments"
        )
    
    comment.content = comment_data.content
    comment.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(comment)
    
    # Load user for response
    result = await db.execute(
        select(ReviewComment)
        .options(selectinload(ReviewComment.user))
        .where(ReviewComment.id == comment.id)
    )
    comment_with_user = result.scalar_one()
    
    return comment_with_user

@router.delete("/reviews/comments/{comment_id}")
async def delete_review_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a review comment"""
    result = await db.execute(
        select(ReviewComment).where(ReviewComment.id == comment_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only delete your own comments"
        )
    
    await db.delete(comment)
    await db.commit()
    
    return {"message": "Comment deleted successfully"}

# Social Feed Endpoints

@router.get("/feed", response_model=SocialFeedResponse)
async def get_social_feed(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get social feed with activities from followed users"""
    # Get users that current user follows
    following_result = await db.execute(
        select(UserFollow.following_id).where(UserFollow.follower_id == current_user.id)
    )
    following_ids = [row[0] for row in following_result.fetchall()]
    following_ids.append(current_user.id)  # Include own activities
    
    # Get recent activities (exclude follow activities)
    activities_result = await db.execute(
        select(UserActivity)
        .options(selectinload(UserActivity.user))
        .where(
            and_(
                UserActivity.user_id.in_(following_ids),
                UserActivity.activity_type != 'followed_user'
            )
        )
        .order_by(desc(UserActivity.created_at))
        .limit(limit)
    )
    activities = activities_result.scalars().all()
    
    # Get recent reviews from followed users
    reviews_result = await db.execute(
        select(Reading)
        .options(
            selectinload(Reading.user),
            selectinload(Reading.book)
        )
        .where(
            and_(
                Reading.user_id.in_(following_ids),
                Reading.is_review_public == True,
                Reading.review.isnot(None)
            )
        )
        .order_by(desc(Reading.updated_at))
        .limit(limit)
    )
    reviews = reviews_result.scalars().all()
    
    # Add interaction counts to reviews
    enhanced_reviews = []
    for reading in reviews:
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
                is_following=True  # They're in our following list
            ),
            like_count=like_count,
            comment_count=comment_count,
            is_liked=is_liked
        )
        enhanced_reviews.append(reading_response)
    
    return SocialFeedResponse(
        activities=activities,
        recent_reviews=enhanced_reviews
    ) 