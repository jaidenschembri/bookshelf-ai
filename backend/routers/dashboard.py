from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta

from database import get_db
from models import User, Reading, Recommendation
from schemas import DashboardResponse, ReadingStats, UserResponse, ReadingResponse, RecommendationResponse
from utils import convert_user_id

router = APIRouter()

@router.get("/{user_id}", response_model=DashboardResponse)
async def get_dashboard(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get user dashboard with reading statistics and recent activity"""
    
    # Convert large OAuth user IDs to SQLite-compatible IDs
    db_user_id = convert_user_id(user_id)
    
    # Verify user exists
    result = await db.execute(select(User).where(User.id == db_user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get current year
    current_year = datetime.now().year
    
    # Calculate reading statistics
    
    # Total books read (finished)
    result = await db.execute(
        select(func.count(Reading.id))
        .where(Reading.user_id == db_user_id, Reading.status == "finished")
    )
    total_books = result.scalar() or 0
    
    # Books read this year
    result = await db.execute(
        select(func.count(Reading.id))
        .where(
            Reading.user_id == db_user_id,
            Reading.status == "finished",
            extract('year', Reading.finished_at) == current_year
        )
    )
    books_this_year = result.scalar() or 0
    
    # Currently reading count
    result = await db.execute(
        select(func.count(Reading.id))
        .where(Reading.user_id == db_user_id, Reading.status == "currently_reading")
    )
    currently_reading = result.scalar() or 0
    
    # Want to read count
    result = await db.execute(
        select(func.count(Reading.id))
        .where(Reading.user_id == db_user_id, Reading.status == "want_to_read")
    )
    want_to_read = result.scalar() or 0
    
    # Finished count
    result = await db.execute(
        select(func.count(Reading.id))
        .where(Reading.user_id == db_user_id, Reading.status == "finished")
    )
    finished = result.scalar() or 0
    
    # Average rating
    result = await db.execute(
        select(func.avg(Reading.rating))
        .where(Reading.user_id == db_user_id, Reading.rating.isnot(None))
    )
    average_rating = result.scalar()
    if average_rating:
        average_rating = round(float(average_rating), 1)
    
    # Calculate goal progress
    reading_goal = user.reading_goal or 12
    goal_progress = min((books_this_year / reading_goal) * 100, 100) if reading_goal > 0 else 0
    
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
    
    # Get recent readings (last 5)
    result = await db.execute(
        select(Reading)
        .options(selectinload(Reading.book))
        .where(Reading.user_id == db_user_id)
        .order_by(Reading.updated_at.desc())
        .limit(5)
    )
    recent_readings = result.scalars().all()
    
    # Get current books (currently reading)
    result = await db.execute(
        select(Reading)
        .options(selectinload(Reading.book))
        .where(Reading.user_id == db_user_id, Reading.status == "currently_reading")
        .order_by(Reading.started_at.desc())
    )
    current_books = result.scalars().all()
    
    # Get recent recommendations (last 3)
    result = await db.execute(
        select(Recommendation)
        .options(selectinload(Recommendation.book))
        .where(
            Recommendation.user_id == db_user_id,
            Recommendation.is_dismissed == False
        )
        .order_by(Recommendation.created_at.desc())
        .limit(3)
    )
    recent_recommendations = result.scalars().all()
    
    return DashboardResponse(
        user=UserResponse.from_orm(user),
        stats=stats,
        recent_readings=[ReadingResponse.from_orm(reading) for reading in recent_readings],
        current_books=[ReadingResponse.from_orm(reading) for reading in current_books],
        recent_recommendations=[RecommendationResponse.from_orm(rec) for rec in recent_recommendations]
    )

@router.get("/{user_id}/stats", response_model=ReadingStats)
async def get_reading_stats(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed reading statistics for a user"""
    
    # Convert large OAuth user IDs to SQLite-compatible IDs
    db_user_id = convert_user_id(user_id)
    
    # Verify user exists
    result = await db.execute(select(User).where(User.id == db_user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # This is a simplified version - the full implementation is in get_dashboard
    # You could add more detailed stats here like reading streaks, monthly breakdowns, etc.
    
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
        .where(Reading.user_id == db_user_id)
    )
    stats_row = result.first()
    
    # Books this year
    result = await db.execute(
        select(func.count(Reading.id))
        .where(
            Reading.user_id == db_user_id,
            Reading.status == "finished",
            extract('year', Reading.finished_at) == current_year
        )
    )
    books_this_year = result.scalar() or 0
    
    reading_goal = user.reading_goal or 12
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