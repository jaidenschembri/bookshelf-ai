from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta

from database import get_db
from models import User, Reading, Recommendation
from schemas import DashboardResponse, ReadingStats, UserResponse, ReadingResponse, RecommendationResponse
from routers.auth import get_current_user
from utils import convert_user_id, logger

router = APIRouter()

@router.get("/", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard for the current authenticated user with reading statistics and recent activity"""
    
    try:
        logger.info(f"Dashboard request for user {current_user.id} ({current_user.email})")
        
        # Get current year
        current_year = datetime.now().year
        
        # Calculate reading statistics
        logger.debug(f"Calculating reading statistics for user {current_user.id}")
        
        # Total books read (finished)
        result = await db.execute(
            select(func.count(Reading.id))
            .where(Reading.user_id == current_user.id, Reading.status == "finished")
        )
        total_books = result.scalar() or 0
        logger.debug(f"Total books: {total_books}")
        
        # Books read this year
        result = await db.execute(
            select(func.count(Reading.id))
            .where(
                Reading.user_id == current_user.id,
                Reading.status == "finished",
                extract('year', Reading.finished_at) == current_year
            )
        )
        books_this_year = result.scalar() or 0
        logger.debug(f"Books this year: {books_this_year}")
        
        # Currently reading count
        result = await db.execute(
            select(func.count(Reading.id))
            .where(Reading.user_id == current_user.id, Reading.status == "currently_reading")
        )
        currently_reading = result.scalar() or 0
        logger.debug(f"Currently reading: {currently_reading}")
        
        # Want to read count
        result = await db.execute(
            select(func.count(Reading.id))
            .where(Reading.user_id == current_user.id, Reading.status == "want_to_read")
        )
        want_to_read = result.scalar() or 0
        logger.debug(f"Want to read: {want_to_read}")
        
        # Finished count
        result = await db.execute(
            select(func.count(Reading.id))
            .where(Reading.user_id == current_user.id, Reading.status == "finished")
        )
        finished = result.scalar() or 0
        logger.debug(f"Finished: {finished}")
        
        # Average rating
        result = await db.execute(
            select(func.avg(Reading.rating))
            .where(Reading.user_id == current_user.id, Reading.rating.isnot(None))
        )
        average_rating = result.scalar()
        if average_rating:
            average_rating = round(float(average_rating), 1)
        logger.debug(f"Average rating: {average_rating}")
        
        # Calculate goal progress
        reading_goal = current_user.reading_goal or 12
        goal_progress = min((books_this_year / reading_goal) * 100, 100) if reading_goal > 0 else 0
        logger.debug(f"Goal progress: {goal_progress}%")
        
        # Create reading stats
        stats = ReadingStats(
            total_books=total_books,
            books_this_year=books_this_year,
            currently_reading=currently_reading,
            want_to_read=want_to_read,
            finished=finished,
            average_rating=average_rating,
            reading_goal=reading_goal,
            goal_progress=round(goal_progress, 1)
        )
        logger.debug("Reading stats created successfully")
        
        # Get recent readings (last 5)
        logger.debug("Fetching recent readings")
        result = await db.execute(
            select(Reading)
            .options(selectinload(Reading.book))
            .where(Reading.user_id == current_user.id)
            .order_by(Reading.updated_at.desc())
            .limit(5)
        )
        recent_readings = result.scalars().all()
        logger.debug(f"Found {len(recent_readings)} recent readings")
        
        # Get current books (currently reading)
        logger.debug("Fetching current books")
        result = await db.execute(
            select(Reading)
            .options(selectinload(Reading.book))
            .where(Reading.user_id == current_user.id, Reading.status == "currently_reading")
            .order_by(Reading.started_at.desc())
        )
        current_books = result.scalars().all()
        logger.debug(f"Found {len(current_books)} current books")
        
        # Get recent recommendations (last 3)
        logger.debug("Fetching recent recommendations")
        result = await db.execute(
            select(Recommendation)
            .options(selectinload(Recommendation.book))
            .where(
                Recommendation.user_id == current_user.id,
                Recommendation.is_dismissed == False
            )
            .order_by(Recommendation.created_at.desc())
            .limit(3)
        )
        recent_recommendations = result.scalars().all()
        logger.debug(f"Found {len(recent_recommendations)} recent recommendations")
        
        # Manually create UserResponse to avoid async issues
        logger.debug("Creating user response")
        user_response = UserResponse(
            id=current_user.id,
            email=current_user.email,
            name=current_user.name,
            username=current_user.username,
            bio=current_user.bio,
            location=current_user.location,
            profile_picture_url=current_user.profile_picture_url,
            reading_goal=current_user.reading_goal,
            timezone=current_user.timezone or "UTC",
            email_verified=current_user.email_verified,
            last_login=current_user.last_login,
            is_active=current_user.is_active,
            created_at=current_user.created_at,
            updated_at=current_user.updated_at,
            is_private=current_user.is_private or False
        )
        logger.debug("User response created successfully")
        
        # Manually create response objects to avoid async issues
        logger.debug("Creating reading responses")
        recent_readings_response = []
        for reading in recent_readings:
            recent_readings_response.append(ReadingResponse(
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
                user=None,
                like_count=0,
                comment_count=0,
                is_liked=False
            ))
        
        current_books_response = []
        for reading in current_books:
            current_books_response.append(ReadingResponse(
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
                user=None,
                like_count=0,
                comment_count=0,
                is_liked=False
            ))
        
        logger.debug("Creating recommendation responses")
        recent_recommendations_response = []
        for rec in recent_recommendations:
            recent_recommendations_response.append(RecommendationResponse(
                id=rec.id,
                user_id=rec.user_id,
                book_id=rec.book_id,
                reason=rec.reason,
                confidence_score=rec.confidence_score,
                is_dismissed=rec.is_dismissed,
                created_at=rec.created_at,
                book=rec.book
            ))
        
        logger.debug("Creating final dashboard response")
        dashboard_response = DashboardResponse(
            user=user_response,
            stats=stats,
            recent_readings=recent_readings_response,
            current_books=current_books_response,
            recent_recommendations=recent_recommendations_response
        )
        
        logger.info(f"Dashboard response created successfully for user {current_user.id}")
        return dashboard_response
        
    except Exception as e:
        logger.error(f"Dashboard error for user {current_user.id}: {str(e)}", exc_info=True)
        # Return more specific error information
        error_detail = f"Dashboard error: {type(e).__name__}: {str(e)}"
        raise HTTPException(status_code=500, detail=error_detail)

@router.get("/stats", response_model=ReadingStats)
async def get_reading_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed reading statistics for the current authenticated user"""
    
    current_year = datetime.now().year
    
    # Get basic counts
    result = await db.execute(
        select(
            func.count(Reading.id).label('total'),
            func.sum(func.case((Reading.status == 'finished', 1), else_=0)).label('finished'),
            func.sum(func.case((Reading.status == 'currently_reading', 1), else_=0)).label('current'),
            func.sum(func.case((Reading.status == 'want_to_read', 1), else_=0)).label('want_to_read'),
            func.avg(Reading.rating).label('avg_rating')
        )
        .where(Reading.user_id == current_user.id)
    )
    stats_row = result.first()
    
    # Books this year
    result = await db.execute(
        select(func.count(Reading.id))
        .where(
            Reading.user_id == current_user.id,
            Reading.status == "finished",
            extract('year', Reading.finished_at) == current_year
        )
    )
    books_this_year = result.scalar() or 0
    
    reading_goal = current_user.reading_goal or 12
    goal_progress = min((books_this_year / reading_goal) * 100, 100) if reading_goal > 0 else 0
    
    return ReadingStats(
        total_books=stats_row.finished or 0,
        books_this_year=books_this_year,
        currently_reading=stats_row.current or 0,
        want_to_read=stats_row.want_to_read or 0,
        finished=stats_row.finished or 0,
        average_rating=round(float(stats_row.avg_rating), 1) if stats_row.avg_rating else None,
        reading_goal=reading_goal,
        goal_progress=round(goal_progress, 1)
    ) 