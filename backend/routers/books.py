from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models import Book, User, Reading
from schemas import BookResponse, BookCreate, BookSearch
from services import book_service
from utils import parse_user_id, logger

router = APIRouter()

@router.get("/search", response_model=List[BookSearch])
async def search_books(
    q: str = Query(..., description="Search query for books"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return")
):
    """Search for books using Open Library API"""
    if not q.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Search query cannot be empty"
        )
    
    books = await book_service.search_open_library(q, limit)
    return books

@router.post("/", response_model=BookResponse)
async def add_book(
    book_data: BookCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add a book to the database"""
    book = await book_service.get_or_create_book(book_data, db)
    return book_service.create_book_response(book)

@router.get("/user/{user_id}", response_model=List[BookResponse])
async def get_user_books(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all books in a user's library"""
    
    # Convert user_id to SQLite-compatible integer
    safe_user_id = parse_user_id(str(user_id))
    
    # Verify user exists
    result = await db.execute(select(User).where(User.id == safe_user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )
    
    # Get user's books through readings
    result = await db.execute(
        select(Book)
        .join(Reading)
        .where(Reading.user_id == safe_user_id)
        .distinct()
    )
    books = result.scalars().all()
    
    return book_service.create_book_responses(books)

@router.get("/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific book by ID"""
    book = await book_service.get_book_by_id(book_id, db)
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Book not found"
        )
    
    return book_service.create_book_response(book) 