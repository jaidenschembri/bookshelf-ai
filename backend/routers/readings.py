from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime

from database import get_db
from models import Reading, User, Book
from schemas import ReadingResponse, ReadingCreate, ReadingUpdate, ReadingStatus
from utils import parse_user_id

router = APIRouter()

@router.post("/", response_model=ReadingResponse)
async def create_reading(
    reading_data: ReadingCreate,
    user_id: int = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Create a new reading entry for a user"""
    
    # Convert user_id to SQLite-compatible integer
    safe_user_id = parse_user_id(str(user_id))
    
    # Verify user exists
    result = await db.execute(select(User).where(User.id == safe_user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify book exists
    result = await db.execute(select(Book).where(Book.id == reading_data.book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Check if reading already exists for this user and book
    result = await db.execute(
        select(Reading).where(
            Reading.user_id == safe_user_id,
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
    reading_dict["user_id"] = safe_user_id
    
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
    await db.commit()
    await db.refresh(reading)
    
    # Load the book relationship
    result = await db.execute(
        select(Reading)
        .options(selectinload(Reading.book))
        .where(Reading.id == reading.id)
    )
    reading_with_book = result.scalar_one()
    
    return ReadingResponse.from_orm(reading_with_book)

@router.get("/user/{user_id}", response_model=List[ReadingResponse])
async def get_user_readings(
    user_id: int,
    status: ReadingStatus = None,
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
    query = select(Reading).options(selectinload(Reading.book)).where(Reading.user_id == safe_user_id)
    
    if status:
        query = query.where(Reading.status == status)
    
    query = query.order_by(Reading.updated_at.desc())
    
    result = await db.execute(query)
    readings = result.scalars().all()
    
    return [ReadingResponse.from_orm(reading) for reading in readings]

@router.put("/{reading_id}", response_model=ReadingResponse)
async def update_reading(
    reading_id: int,
    reading_update: ReadingUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a reading entry"""
    
    # Get existing reading
    result = await db.execute(
        select(Reading)
        .options(selectinload(Reading.book))
        .where(Reading.id == reading_id)
    )
    reading = result.scalar_one_or_none()
    
    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    
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
    
    await db.commit()
    await db.refresh(reading)
    
    return ReadingResponse.from_orm(reading)

@router.get("/{reading_id}", response_model=ReadingResponse)
async def get_reading(
    reading_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific reading entry"""
    
    result = await db.execute(
        select(Reading)
        .options(selectinload(Reading.book))
        .where(Reading.id == reading_id)
    )
    reading = result.scalar_one_or_none()
    
    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    
    return ReadingResponse.from_orm(reading)

@router.delete("/{reading_id}")
async def delete_reading(
    reading_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a reading entry"""
    
    result = await db.execute(select(Reading).where(Reading.id == reading_id))
    reading = result.scalar_one_or_none()
    
    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    
    await db.delete(reading)
    await db.commit()
    
    return {"message": "Reading deleted successfully"} 