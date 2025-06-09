from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta

from database import get_db
from models import User, Reading, Recommendation
from schemas import DashboardResponse, ReadingStats, UserResponse, ReadingResponse, RecommendationResponse
from services import reading_service
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
        
        # Calculate reading statistics using service
        logger.debug(f"Calculating reading statistics for user {current_user.id}")
        stats = await reading_service.get_reading_statistics(current_user.id, db)
        logger.debug("Reading stats created successfully")
        
        # Get recent readings (last 5)
        logger.debug("Fetching recent readings")
        recent_readings = await reading_service.get_user_readings(
            current_user.id, None, db, limit=5
        )
        logger.debug(f"Found {len(recent_readings)} recent readings")
        
        # Get current books (currently reading)
        logger.debug("Fetching current books")
        from schemas import ReadingStatus
        current_books = await reading_service.get_user_readings(
            current_user.id, ReadingStatus.CURRENTLY_READING, db
        )
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
        
        # Create reading responses using service
        logger.debug("Creating reading responses")
        recent_readings_response = await reading_service.create_reading_responses(
            recent_readings, current_user.id, db
        )
        
        current_books_response = await reading_service.create_reading_responses(
            current_books, current_user.id, db
        )
        
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
    
    return await reading_service.get_reading_statistics(current_user.id, db) 