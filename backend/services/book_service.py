import httpx
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
import logging

from error_handlers import ExternalAPIError, DatabaseError
from models import Book
from schemas import BookSearch, BookResponse, BookCreate

logger = logging.getLogger(__name__)

class BookService:
    """Centralized service for all book operations"""
    
    OPEN_LIBRARY_BASE_URL = "https://openlibrary.org"
    COVERS_BASE_URL = "https://covers.openlibrary.org"
    DEFAULT_TIMEOUT = 10.0
    
    async def search_open_library(self, query: str, limit: int = 10) -> List[BookSearch]:
        """
        Search books using Open Library API
        
        Args:
            query: Search query
            limit: Maximum number of results
            
        Returns:
            List of book search results
            
        Raises:
            ExternalAPIError: If API call fails
        """
        if not query.strip():
            return []
        
        try:
            async with httpx.AsyncClient(timeout=self.DEFAULT_TIMEOUT) as client:
                response = await client.get(
                    f"{self.OPEN_LIBRARY_BASE_URL}/search.json",
                    params={
                        "q": query.strip(),
                        "limit": min(limit, 50),  # Cap at 50
                        "fields": "key,title,author_name,isbn,cover_i,first_publish_year,subject"
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                books = []
                for doc in data.get("docs", []):
                    book_search = self._parse_open_library_doc(doc)
                    if book_search:
                        books.append(book_search)
                
                logger.info(f"Found {len(books)} books for query: {query}")
                return books
                
        except httpx.TimeoutException:
            raise ExternalAPIError("Open Library search timed out")
        except httpx.HTTPStatusError as e:
            raise ExternalAPIError(f"Open Library API error: {e.response.status_code}")
        except httpx.RequestError as e:
            raise ExternalAPIError(f"Open Library network error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in Open Library search: {e}")
            raise ExternalAPIError(f"Open Library search failed: {str(e)}")
    
    def _parse_open_library_doc(self, doc: Dict[str, Any]) -> Optional[BookSearch]:
        """
        Parse a single Open Library document into BookSearch object
        
        Args:
            doc: Raw document from Open Library API
            
        Returns:
            BookSearch object or None if parsing fails
        """
        try:
            # Get cover URL if available
            cover_url = None
            if doc.get("cover_i"):
                cover_url = f"{self.COVERS_BASE_URL}/b/id/{doc['cover_i']}-M.jpg"
            
            # Get first author
            author = "Unknown Author"
            if doc.get("author_name") and len(doc["author_name"]) > 0:
                author = doc["author_name"][0]
            
            # Get first ISBN
            isbn = None
            if doc.get("isbn") and len(doc["isbn"]) > 0:
                isbn = doc["isbn"][0]
            
            # Clean title
            title = doc.get("title", "").strip()
            if not title:
                return None  # Skip books without titles
            
            return BookSearch(
                title=title,
                author=author,
                isbn=isbn,
                cover_url=cover_url,
                publication_year=doc.get("first_publish_year"),
                open_library_key=doc.get("key"),
                description=None  # Would need separate API call for description
            )
            
        except Exception as e:
            logger.warning(f"Failed to parse Open Library document: {e}")
            return None
    
    async def get_or_create_book(
        self, 
        book_data: BookCreate, 
        db: AsyncSession
    ) -> Book:
        """
        Get existing book or create new one
        
        Args:
            book_data: Book creation data
            db: Database session
            
        Returns:
            Book instance (existing or newly created)
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            # Check if book already exists by ISBN or Open Library ID
            existing_book = await self._find_existing_book(book_data, db)
            
            if existing_book:
                logger.debug(f"Found existing book: {existing_book.title}")
                return existing_book
            
            # Create new book
            book = Book(**book_data.dict())
            db.add(book)
            await db.commit()
            await db.refresh(book)
            
            logger.info(f"Created new book: {book.title} by {book.author}")
            return book
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating/finding book: {e}")
            raise DatabaseError(f"Failed to create book: {str(e)}")
    
    async def _find_existing_book(
        self, 
        book_data: BookCreate, 
        db: AsyncSession
    ) -> Optional[Book]:
        """
        Find existing book by ISBN, Open Library ID, or title+author
        
        Args:
            book_data: Book data to search for
            db: Database session
            
        Returns:
            Existing book or None
        """
        # First try ISBN if available
        if book_data.isbn:
            result = await db.execute(
                select(Book).where(Book.isbn == book_data.isbn)
            )
            book = result.scalar_one_or_none()
            if book:
                return book
        
        # Then try Open Library ID if available
        if book_data.open_library_id:
            result = await db.execute(
                select(Book).where(Book.open_library_id == book_data.open_library_id)
            )
            book = result.scalar_one_or_none()
            if book:
                return book
        
        # Finally try title + author combination (fuzzy match)
        if book_data.title and book_data.author:
            result = await db.execute(
                select(Book).where(
                    Book.title.ilike(f"%{book_data.title}%"),
                    Book.author.ilike(f"%{book_data.author}%")
                )
            )
            book = result.scalar_one_or_none()
            if book:
                return book
        
        return None
    
    async def get_book_by_id(self, book_id: int, db: AsyncSession) -> Optional[Book]:
        """
        Get book by ID
        
        Args:
            book_id: Book ID
            db: Database session
            
        Returns:
            Book instance or None
        """
        try:
            result = await db.execute(select(Book).where(Book.id == book_id))
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching book {book_id}: {e}")
            raise DatabaseError(f"Failed to fetch book: {str(e)}")
    
    async def search_books_in_db(
        self, 
        query: str, 
        limit: int, 
        db: AsyncSession
    ) -> List[Book]:
        """
        Search for books in local database
        
        Args:
            query: Search query
            limit: Maximum results
            db: Database session
            
        Returns:
            List of matching books
        """
        try:
            result = await db.execute(
                select(Book).where(
                    or_(
                        Book.title.ilike(f"%{query}%"),
                        Book.author.ilike(f"%{query}%"),
                        Book.isbn == query
                    )
                ).limit(limit)
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error searching books in database: {e}")
            raise DatabaseError(f"Database search failed: {str(e)}")
    
    def create_book_response(self, book: Book) -> BookResponse:
        """
        Create BookResponse from Book model
        
        Args:
            book: Book model instance
            
        Returns:
            BookResponse object
        """
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
            average_rating=book.average_rating or 0.0,
            total_ratings=book.total_ratings or 0,
            created_at=book.created_at
        )
    
    def create_book_responses(self, books: List[Book]) -> List[BookResponse]:
        """
        Create list of BookResponse objects from Book models
        
        Args:
            books: List of Book model instances
            
        Returns:
            List of BookResponse objects
        """
        return [self.create_book_response(book) for book in books]
    
    async def get_book_details_from_open_library(
        self, 
        open_library_key: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get detailed book information from Open Library
        
        Args:
            open_library_key: Open Library key (e.g., '/works/OL123456W')
            
        Returns:
            Book details dictionary or None
        """
        try:
            async with httpx.AsyncClient(timeout=self.DEFAULT_TIMEOUT) as client:
                response = await client.get(
                    f"{self.OPEN_LIBRARY_BASE_URL}{open_library_key}.json"
                )
                response.raise_for_status()
                return response.json()
                
        except httpx.TimeoutException:
            logger.warning(f"Timeout getting details for {open_library_key}")
        except httpx.HTTPStatusError as e:
            logger.warning(f"HTTP error getting details for {open_library_key}: {e.response.status_code}")
        except Exception as e:
            logger.warning(f"Error getting details for {open_library_key}: {e}")
        
        return None

# Global instance
book_service = BookService() 