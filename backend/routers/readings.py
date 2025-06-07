from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime

from database import get_db
from models import Reading, User, Book, UserActivity, ReviewLike, ReviewComment
from schemas import ReadingResponse, ReadingCreate, ReadingUpdate, ReadingStatus
from utils import parse_user_id
from routers.auth import get_current_user

router = APIRouter()

async def create_activity(db: AsyncSession, user_id: int, activity_type: str, activity_data: dict):
    """Helper function to create user activity"""
    activity = UserActivity(
        user_id=user_id,
        activity_type=activity_type,
        activity_data=activity_data
    )
    db.add(activity)

async def update_book_rating(db: AsyncSession, book_id: int):
    """Helper function to update book's average rating"""
    # Calculate new average rating
    result = await db.execute(
        select(
            func.avg(Reading.rating).label('avg_rating'),
            func.count(Reading.rating).label('total_ratings')
        ).where(
            Reading.book_id == book_id,
            Reading.rating.isnot(None)
        )
    )
    stats = result.first()
    
    if stats and stats.total_ratings > 0:
        # Update book
        book_result = await db.execute(select(Book).where(Book.id == book_id))
        book = book_result.scalar_one_or_none()
        if book:
            book.average_rating = round(float(stats.avg_rating), 2)
            book.total_ratings = stats.total_ratings

@router.post("/", response_model=ReadingResponse)
async def create_reading(
    reading_data: ReadingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new reading entry for the current user"""
    
    # Verify book exists
    result = await db.execute(select(Book).where(Book.id == reading_data.book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Check if reading already exists for this user and book
    result = await db.execute(
        select(Reading).where(
            Reading.user_id == current_user.id,
            Reading.book_id == reading_data.book_id
        )
    )
    existing_reading = result.scalar_one_or_none()
    
    if existing_reading:
        raise HTTPException(
            status_code=400, 
            detail="Reading entry already exists for this book"
        )
    
    # Create reading entry
    reading_dict = reading_data.dict()
    reading_dict["user_id"] = current_user.id
    
    # Set timestamps based on status
    if reading_data.status == ReadingStatus.CURRENTLY_READING:
        reading_dict["started_at"] = datetime.utcnow()
    elif reading_data.status == ReadingStatus.FINISHED:
        reading_dict["started_at"] = datetime.utcnow()
        reading_dict["finished_at"] = datetime.utcnow()
    
    # Set total_pages from book if not provided
    if not reading_dict.get("total_pages") and book.total_pages:
        reading_dict["total_pages"] = book.total_pages
    
    reading = Reading(**reading_dict)
    db.add(reading)
    
    # Create activity for adding book to library
    activity_data = {
        "book_id": book.id,
        "book_title": book.title,
        "book_author": book.author,
        "status": reading_data.status
    }
    
    if reading_data.status == ReadingStatus.FINISHED:
        await create_activity(db, current_user.id, "finished_book", activity_data)
        if reading_data.rating:
            activity_data["rating"] = reading_data.rating
            await create_activity(db, current_user.id, "rated_book", activity_data)
        if reading_data.review:
            activity_data["has_review"] = True
            await create_activity(db, current_user.id, "reviewed_book", activity_data)
    
    await db.commit()
    await db.refresh(reading)
    
    # Update book rating if a rating was provided
    if reading_data.rating:
        await update_book_rating(db, book.id)
        await db.commit()
    
    # Load the book relationship and enhance with social data
    result = await db.execute(
        select(Reading)
        .options(selectinload(Reading.book), selectinload(Reading.user))
        .where(Reading.id == reading.id)
    )
    reading_with_relations = result.scalar_one()
    
    # Get interaction counts
    like_count = 0
    comment_count = 0
    is_liked = False
    
    if reading.review and reading.is_review_public:
        like_count_result = await db.execute(
            select(func.count(ReviewLike.id)).where(ReviewLike.reading_id == reading.id)
        )
        like_count = like_count_result.scalar() or 0
        
        comment_count_result = await db.execute(
            select(func.count(ReviewComment.id)).where(ReviewComment.reading_id == reading.id)
        )
        comment_count = comment_count_result.scalar() or 0
    
    # Create enhanced response
    from schemas import UserPublicProfile
    reading_response = ReadingResponse(
        id=reading_with_relations.id,
        user_id=reading_with_relations.user_id,
        book_id=reading_with_relations.book_id,
        status=reading_with_relations.status,
        rating=reading_with_relations.rating,
        review=reading_with_relations.review,
        is_review_public=reading_with_relations.is_review_public,
        progress_pages=reading_with_relations.progress_pages,
        total_pages=reading_with_relations.total_pages,
        started_at=reading_with_relations.started_at,
        finished_at=reading_with_relations.finished_at,
        created_at=reading_with_relations.created_at,
        updated_at=reading_with_relations.updated_at,
        book=reading_with_relations.book,
        user=UserPublicProfile(
            id=reading_with_relations.user.id,
            name=reading_with_relations.user.name,
            username=reading_with_relations.user.username,
            bio=reading_with_relations.user.bio,
            location=reading_with_relations.user.location,
            profile_picture_url=reading_with_relations.user.profile_picture_url,
            reading_goal=reading_with_relations.user.reading_goal,
            is_private=reading_with_relations.user.is_private,
            created_at=reading_with_relations.user.created_at,
            follower_count=0,
            following_count=0,
            is_following=False
        ),
        like_count=like_count,
        comment_count=comment_count,
        is_liked=is_liked
    )
    
    return reading_response

@router.get("/user/{user_id}", response_model=List[ReadingResponse])
async def get_user_readings(
    user_id: int,
    status: ReadingStatus = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all readings for a user, optionally filtered by status"""
    
    # Convert user_id to SQLite-compatible integer
    safe_user_id = parse_user_id(str(user_id))
    
    # Verify user exists
    result = await db.execute(select(User).where(User.id == safe_user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build query
    query = select(Reading).options(
        selectinload(Reading.book),
        selectinload(Reading.user)
    ).where(Reading.user_id == safe_user_id)
    
    if status:
        query = query.where(Reading.status == status)
    
    query = query.order_by(Reading.updated_at.desc())
    
    result = await db.execute(query)
    readings = result.scalars().all()
    
    # Enhance with social data
    enhanced_readings = []
    for reading in readings:
        # Get interaction counts
        like_count = 0
        comment_count = 0
        is_liked = False
        
        if reading.review and reading.is_review_public:
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
                    ReviewLike.reading_id == reading.id,
                    ReviewLike.user_id == current_user.id
                )
            )
            is_liked = is_liked_result.scalar_one_or_none() is not None
        
        from schemas import UserPublicProfile
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
                follower_count=0,
                following_count=0,
                is_following=safe_user_id != current_user.id
            ),
            like_count=like_count,
            comment_count=comment_count,
            is_liked=is_liked
        )
        enhanced_readings.append(reading_response)
    
    return enhanced_readings

@router.put("/{reading_id}", response_model=ReadingResponse)
async def update_reading(
    reading_id: int,
    reading_update: ReadingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a reading entry"""
    
    # Get existing reading
    result = await db.execute(
        select(Reading)
        .options(selectinload(Reading.book), selectinload(Reading.user))
        .where(Reading.id == reading_id)
    )
    reading = result.scalar_one_or_none()
    
    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    
    # Check if user owns this reading
    if reading.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this reading")
    
    # Store old values for activity tracking
    old_status = reading.status
    old_rating = reading.rating
    old_review = reading.review
    
    # Update fields
    update_data = reading_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(reading, field, value)
    
    # Handle status changes
    if reading_update.status:
        if reading_update.status == ReadingStatus.CURRENTLY_READING and not reading.started_at:
            reading.started_at = datetime.utcnow()
        elif reading_update.status == ReadingStatus.FINISHED:
            if not reading.started_at:
                reading.started_at = datetime.utcnow()
            reading.finished_at = datetime.utcnow()
            # Set progress to 100% when finished
            if reading.total_pages:
                reading.progress_pages = reading.total_pages
    
    reading.updated_at = datetime.utcnow()
    
    # Create activities for significant changes
    activity_data = {
        "book_id": reading.book.id,
        "book_title": reading.book.title,
        "book_author": reading.book.author,
        "reading_id": reading.id
    }
    
    # Status change to finished
    if old_status != ReadingStatus.FINISHED and reading.status == ReadingStatus.FINISHED:
        await create_activity(db, current_user.id, "finished_book", activity_data)
    
    # New rating or rating change
    if reading_update.rating is not None and old_rating != reading.rating:
        activity_data["rating"] = reading.rating
        await create_activity(db, current_user.id, "rated_book", activity_data)
    
    # New review or review change
    if reading_update.review is not None and old_review != reading.review and reading.review:
        activity_data["has_review"] = True
        await create_activity(db, current_user.id, "reviewed_book", activity_data)
    
    await db.commit()
    await db.refresh(reading)
    
    # Update book rating if rating changed
    if reading_update.rating is not None:
        await update_book_rating(db, reading.book.id)
        await db.commit()
    
    # Get interaction counts
    like_count = 0
    comment_count = 0
    is_liked = False
    
    if reading.review and reading.is_review_public:
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
                ReviewLike.reading_id == reading.id,
                ReviewLike.user_id == current_user.id
            )
        )
        is_liked = is_liked_result.scalar_one_or_none() is not None
    
    # Create enhanced response
    from schemas import UserPublicProfile
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
            follower_count=0,
            following_count=0,
            is_following=False
        ),
        like_count=like_count,
        comment_count=comment_count,
        is_liked=is_liked
    )
    
    return reading_response

@router.get("/{reading_id}", response_model=ReadingResponse)
async def get_reading(
    reading_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific reading entry"""
    
    result = await db.execute(
        select(Reading)
        .options(selectinload(Reading.book), selectinload(Reading.user))
        .where(Reading.id == reading_id)
    )
    reading = result.scalar_one_or_none()
    
    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    
    # Get interaction counts
    like_count = 0
    comment_count = 0
    is_liked = False
    
    if reading.review and reading.is_review_public:
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
                ReviewLike.reading_id == reading.id,
                ReviewLike.user_id == current_user.id
            )
        )
        is_liked = is_liked_result.scalar_one_or_none() is not None
    
    # Create enhanced response
    from schemas import UserPublicProfile
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
            follower_count=0,
            following_count=0,
            is_following=reading.user_id != current_user.id
        ),
        like_count=like_count,
        comment_count=comment_count,
        is_liked=is_liked
    )
    
    return reading_response

@router.delete("/{reading_id}")
async def delete_reading(
    reading_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a reading entry"""
    
    result = await db.execute(select(Reading).where(Reading.id == reading_id))
    reading = result.scalar_one_or_none()
    
    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    
    # Check if user owns this reading
    if reading.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this reading")
    
    book_id = reading.book_id
    
    await db.delete(reading)
    await db.commit()
    
    # Update book rating after deletion
    await update_book_rating(db, book_id)
    await db.commit()
    
    return {"message": "Reading deleted successfully"} 