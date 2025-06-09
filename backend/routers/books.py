from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List
import httpx
import asyncio

from database import get_db
from models import Book, User
from schemas import BookResponse, BookCreate, BookSearch
from utils import parse_user_id, log_api_error, log_external_api_call, logger

router = APIRouter()

async def search_open_library(query: str, limit: int = 10) -> List[BookSearch]:
    """Search books using Open Library API"""
    async with httpx.AsyncClient() as client:
        try:
            # Search Open Library
            response = await client.get(
                "https://openlibrary.org/search.json",
                params={
                    "q": query,
                    "limit": limit,
                    "fields": "key,title,author_name,isbn,cover_i,first_publish_year,subject"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            books = []
            for doc in data.get("docs", []):
                # Get cover URL if available
                cover_url = None
                if doc.get("cover_i"):
                    cover_url = f"https://covers.openlibrary.org/b/id/{doc['cover_i']}-M.jpg"
                
                # Get first author
                author = "Unknown Author"
                if doc.get("author_name"):
                    author = doc["author_name"][0]
                
                # Get first ISBN
                isbn = None
                if doc.get("isbn"):
                    isbn = doc["isbn"][0]
                
                books.append(BookSearch(
                    title=doc.get("title", "Unknown Title"),
                    author=author,
                    isbn=isbn,
                    cover_url=cover_url,
                    publication_year=doc.get("first_publish_year"),
                    open_library_key=doc.get("key"),
                    description=None  # Would need separate API call for description
                ))
            
            return books
            
        except Exception as e:
            log_api_error("search_open_library", e)
            return []

@router.get("/search", response_model=List[BookSearch])
async def search_books(
    q: str = Query(..., description="Search query for books"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return")
):
    """Search for books using Open Library API"""
    if not q.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    
    books = await search_open_library(q, limit)
    return books

@router.post("/", response_model=BookResponse)
async def add_book(
    book_data: BookCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add a book to the database"""
    
    # Check if book already exists by ISBN or Open Library ID
    existing_book = None
    if book_data.isbn:
        result = await db.execute(select(Book).where(Book.isbn == book_data.isbn))
        existing_book = result.scalar_one_or_none()
    
    if not existing_book and book_data.open_library_id:
        result = await db.execute(select(Book).where(Book.open_library_id == book_data.open_library_id))
        existing_book = result.scalar_one_or_none()
    
    if existing_book:
        # Manually create response to avoid async issues
        return BookResponse(
            id=existing_book.id,
            title=existing_book.title,
            author=existing_book.author,
            isbn=existing_book.isbn,
            cover_url=existing_book.cover_url,
            description=existing_book.description,
            publication_year=existing_book.publication_year,
            genre=existing_book.genre,
            total_pages=existing_book.total_pages,
            open_library_id=existing_book.open_library_id,
            average_rating=existing_book.average_rating,
            total_ratings=existing_book.total_ratings,
            created_at=existing_book.created_at
        )
    
    # Create new book
    book = Book(**book_data.dict())
    db.add(book)
    await db.commit()
    await db.refresh(book)
    
    # Manually create response to avoid async issues
    return BookResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        isbn=book.isbn,
        cover_url=book.cover_url,
        description=book.description,
        publication_year=book.publication_year,
        genre=book.genre,
        total_pages=book.total_pages,
        open_library_id=book.open_library_id,
        average_rating=book.average_rating,
        total_ratings=book.total_ratings,
        created_at=book.created_at
    )

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
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's books through readings
    from models import Reading
    result = await db.execute(
        select(Book)
        .join(Reading)
        .where(Reading.user_id == safe_user_id)
        .distinct()
    )
    books = result.scalars().all()
    
    # Manually create response objects to avoid async issues
    books_response = []
    for book in books:
        books_response.append(BookResponse(
            id=book.id,
            title=book.title,
            author=book.author,
            isbn=book.isbn,
            cover_url=book.cover_url,
            description=book.description,
            publication_year=book.publication_year,
            genre=book.genre,
            total_pages=book.total_pages,
            open_library_id=book.open_library_id,
            average_rating=book.average_rating,
            total_ratings=book.total_ratings,
            created_at=book.created_at
        ))
    
    return books_response

@router.get("/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific book by ID"""
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Manually create response to avoid async issues
    return BookResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        isbn=book.isbn,
        cover_url=book.cover_url,
        description=book.description,
        publication_year=book.publication_year,
        genre=book.genre,
        total_pages=book.total_pages,
        open_library_id=book.open_library_id,
        average_rating=book.average_rating,
        total_ratings=book.total_ratings,
        created_at=book.created_at
    ) 