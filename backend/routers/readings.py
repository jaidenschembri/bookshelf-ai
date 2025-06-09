from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from models import User
from schemas import ReadingResponse, ReadingCreate, ReadingUpdate, ReadingStatus
from services import reading_service
from routers.auth import get_current_user
from utils import parse_user_id, logger

router = APIRouter()

@router.post("/", response_model=ReadingResponse)
async def create_reading(
    reading_data: ReadingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new reading entry for the current user"""
    
    reading = await reading_service.create_reading(reading_data, current_user, db)
    
    # Load relations and create response
    reading_with_relations = await reading_service.get_reading_by_id(
        reading.id, db, include_relations=True
    )
    
    return await reading_service.create_reading_response(
        reading_with_relations, current_user.id, db
    )

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
    
    # Get readings
    readings = await reading_service.get_user_readings(safe_user_id, status, db)
    
    # Create responses with social data
    return await reading_service.create_reading_responses(readings, current_user.id, db)

@router.put("/{reading_id}", response_model=ReadingResponse)
async def update_reading(
    reading_id: int,
    reading_update: ReadingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a reading entry"""
    
    reading = await reading_service.update_reading(reading_id, reading_update, current_user, db)
    
    # Load relations and create response
    reading_with_relations = await reading_service.get_reading_by_id(
        reading.id, db, include_relations=True
    )
    
    return await reading_service.create_reading_response(
        reading_with_relations, current_user.id, db
    )

@router.get("/{reading_id}", response_model=ReadingResponse)
async def get_reading(
    reading_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific reading by ID"""
    
    reading = await reading_service.get_reading_by_id(reading_id, db, include_relations=True)
    
    if not reading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Reading not found"
        )
    
    return await reading_service.create_reading_response(reading, current_user.id, db)

@router.delete("/{reading_id}")
async def delete_reading(
    reading_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a reading entry"""
    
    success = await reading_service.delete_reading(reading_id, current_user, db)
    
    if success:
        return {"message": "Reading deleted successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete reading"
        ) 