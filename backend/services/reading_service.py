from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from sqlalchemy.orm import selectinload
from datetime import datetime
import logging

from error_handlers import DatabaseError, ValidationError
from models import Reading, Book, User, UserActivity, ReviewLike, ReviewComment
from schemas import (
    ReadingResponse, ReadingCreate, ReadingUpdate, ReadingStatus, 
    ReadingStats, UserPublicProfile
)

logger = logging.getLogger(__name__)

class ReadingService:
    """Centralized service for all reading operations"""
    
    async def create_reading(
        self,
        reading_data: ReadingCreate,
        user: User,
        db: AsyncSession
    ) -> Reading:
        """
        Create a new reading entry
        
        Args:
            reading_data: Reading creation data
            user: Current user
            db: Database session
            
        Returns:
            Created reading instance
            
        Raises:
            DatabaseError: If creation fails
            ValidationError: If book doesn't exist or reading already exists
        """
        try:
            # Verify book exists
            result = await db.execute(select(Book).where(Book.id == reading_data.book_id))
            book = result.scalar_one_or_none()
            if not book:
                raise ValidationError("Book not found")
            
            # Check if reading already exists for this user and book
            existing_reading = await self.get_reading_by_user_and_book(
                user.id, reading_data.book_id, db
            )
            if existing_reading:
                raise ValidationError("Reading entry already exists for this book")
            
            # Create reading entry
            reading_dict = reading_data.dict()
            reading_dict["user_id"] = user.id
            
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
            
            # Create user activities
            await self._create_reading_activities(reading, user.id, db, book)
            
            await db.commit()
            await db.refresh(reading)
            
            # Update book rating if a rating was provided
            if reading_data.rating:
                await self.update_book_rating(db, book.id)
                await db.commit()
            
            logger.info(f"Created reading for user {user.id}, book {book.title}")
            return reading
            
        except (ValidationError, DatabaseError):
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating reading: {e}")
            raise DatabaseError(f"Failed to create reading: {str(e)}")
    
    async def update_reading(
        self,
        reading_id: int,
        reading_update: ReadingUpdate,
        user: User,
        db: AsyncSession
    ) -> Reading:
        """
        Update a reading entry
        
        Args:
            reading_id: Reading ID to update
            reading_update: Update data
            user: Current user
            db: Database session
            
        Returns:
            Updated reading instance
            
        Raises:
            DatabaseError: If update fails
            ValidationError: If reading not found or user not authorized
        """
        try:
            # Get existing reading
            reading = await self.get_reading_by_id(reading_id, db, include_relations=True)
            if not reading:
                raise ValidationError("Reading not found")
            
            # Check if user owns this reading
            if reading.user_id != user.id:
                raise ValidationError("Not authorized to update this reading")
            
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
                self._handle_status_changes(reading, reading_update.status)
            
            reading.updated_at = datetime.utcnow()
            
            # Create activities for significant changes
            await self._create_update_activities(
                reading, user.id, old_status, old_rating, old_review, db
            )
            
            await db.commit()
            await db.refresh(reading)
            
            # Update book rating if rating changed
            if reading_update.rating is not None:
                await self.update_book_rating(db, reading.book.id)
                await db.commit()
            
            logger.info(f"Updated reading {reading_id} for user {user.id}")
            return reading
            
        except (ValidationError, DatabaseError):
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating reading {reading_id}: {e}")
            raise DatabaseError(f"Failed to update reading: {str(e)}")
    
    async def delete_reading(
        self,
        reading_id: int,
        user: User,
        db: AsyncSession
    ) -> bool:
        """
        Delete a reading entry
        
        Args:
            reading_id: Reading ID to delete
            user: Current user
            db: Database session
            
        Returns:
            True if deleted successfully
            
        Raises:
            DatabaseError: If deletion fails
            ValidationError: If reading not found or user not authorized
        """
        try:
            reading = await self.get_reading_by_id(reading_id, db, include_relations=True)
            if not reading:
                raise ValidationError("Reading not found")
            
            if reading.user_id != user.id:
                raise ValidationError("Not authorized to delete this reading")
            
            book_id = reading.book.id
            
            await db.delete(reading)
            await db.commit()
            
            # Update book rating after deletion
            await self.update_book_rating(db, book_id)
            await db.commit()
            
            logger.info(f"Deleted reading {reading_id} for user {user.id}")
            return True
            
        except (ValidationError, DatabaseError):
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            logger.error(f"Error deleting reading {reading_id}: {e}")
            raise DatabaseError(f"Failed to delete reading: {str(e)}")
    
    async def get_reading_by_id(
        self,
        reading_id: int,
        db: AsyncSession,
        include_relations: bool = True
    ) -> Optional[Reading]:
        """
        Get reading by ID with optional relations
        
        Args:
            reading_id: Reading ID
            db: Database session
            include_relations: Whether to include book and user relations
            
        Returns:
            Reading instance or None
        """
        try:
            query = select(Reading)
            if include_relations:
                query = query.options(
                    selectinload(Reading.book),
                    selectinload(Reading.user)
                )
            
            result = await db.execute(query.where(Reading.id == reading_id))
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error(f"Error fetching reading {reading_id}: {e}")
            raise DatabaseError(f"Failed to fetch reading: {str(e)}")
    
    async def get_reading_by_user_and_book(
        self,
        user_id: int,
        book_id: int,
        db: AsyncSession
    ) -> Optional[Reading]:
        """
        Get reading by user and book combination
        
        Args:
            user_id: User ID
            book_id: Book ID
            db: Database session
            
        Returns:
            Reading instance or None
        """
        try:
            result = await db.execute(
                select(Reading).where(
                    Reading.user_id == user_id,
                    Reading.book_id == book_id
                )
            )
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error(f"Error fetching reading for user {user_id}, book {book_id}: {e}")
            raise DatabaseError(f"Failed to fetch reading: {str(e)}")
    
    async def get_user_readings(
        self,
        user_id: int,
        status: Optional[ReadingStatus],
        db: AsyncSession,
        limit: Optional[int] = None
    ) -> List[Reading]:
        """
        Get all readings for a user, optionally filtered by status
        
        Args:
            user_id: User ID
            status: Optional status filter
            db: Database session
            limit: Optional limit on results
            
        Returns:
            List of reading instances
        """
        try:
            query = select(Reading).options(
                selectinload(Reading.book),
                selectinload(Reading.user)
            ).where(Reading.user_id == user_id)
            
            if status:
                query = query.where(Reading.status == status)
            
            query = query.order_by(Reading.updated_at.desc())
            
            if limit:
                query = query.limit(limit)
            
            result = await db.execute(query)
            return result.scalars().all()
            
        except Exception as e:
            logger.error(f"Error fetching readings for user {user_id}: {e}")
            raise DatabaseError(f"Failed to fetch user readings: {str(e)}")
    
    async def get_reading_statistics(
        self,
        user_id: int,
        db: AsyncSession
    ) -> ReadingStats:
        """
        Calculate comprehensive reading statistics for a user
        
        Args:
            user_id: User ID
            db: Database session
            
        Returns:
            ReadingStats object with all statistics
        """
        try:
            current_year = datetime.now().year
            
            # Get basic counts
            result = await db.execute(
                select(
                    func.count(Reading.id).label('total'),
                    func.sum(func.case((Reading.status == 'finished', 1), else_=0)).label('finished'),
                    func.sum(func.case((Reading.status == 'currently_reading', 1), else_=0)).label('current'),
                    func.sum(func.case((Reading.status == 'want_to_read', 1), else_=0)).label('want_to_read'),
                    func.avg(Reading.rating).label('avg_rating')
                ).where(Reading.user_id == user_id)
            )
            stats_row = result.first()
            
            # Books this year
            result = await db.execute(
                select(func.count(Reading.id))
                .where(
                    Reading.user_id == user_id,
                    Reading.status == "finished",
                    extract('year', Reading.finished_at) == current_year
                )
            )
            books_this_year = result.scalar() or 0
            
            # Get user's reading goal
            user_result = await db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            reading_goal = user.reading_goal if user else 12
            
            # Calculate goal progress
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
            
        except Exception as e:
            logger.error(f"Error calculating reading statistics for user {user_id}: {e}")
            raise DatabaseError(f"Failed to calculate reading statistics: {str(e)}")
    
    async def update_book_rating(self, db: AsyncSession, book_id: int):
        """
        Update book's average rating based on all readings
        
        Args:
            db: Database session
            book_id: Book ID to update
        """
        try:
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
                    logger.debug(f"Updated book {book_id} rating: {book.average_rating} ({book.total_ratings} ratings)")
            
        except Exception as e:
            logger.error(f"Error updating book rating for book {book_id}: {e}")
            # Don't raise here as this is often called as a side effect
    
    async def create_reading_response(
        self,
        reading: Reading,
        current_user_id: int,
        db: AsyncSession
    ) -> ReadingResponse:
        """
        Create a comprehensive ReadingResponse with social data
        
        Args:
            reading: Reading instance (with relations loaded)
            current_user_id: Current user ID for social context
            db: Database session
            
        Returns:
            Complete ReadingResponse object
        """
        try:
            # Get interaction counts
            like_count = 0
            comment_count = 0
            is_liked = False
            
            if reading.review and reading.is_review_public:
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
                        ReviewLike.reading_id == reading.id,
                        ReviewLike.user_id == current_user_id
                    )
                )
                is_liked = is_liked_result.scalar_one_or_none() is not None
            
            # Create user profile (if user relation is loaded)
            user_profile = None
            if reading.user:
                user_profile = UserPublicProfile(
                    id=reading.user.id,
                    name=reading.user.name,
                    username=reading.user.username,
                    bio=reading.user.bio,
                    location=reading.user.location,
                    profile_picture_url=reading.user.profile_picture_url,
                    reading_goal=reading.user.reading_goal,
                    is_private=reading.user.is_private,
                    created_at=reading.user.created_at,
                    follower_count=0,  # Could be calculated if needed
                    following_count=0,  # Could be calculated if needed
                    is_following=reading.user_id != current_user_id
                )
            
            return ReadingResponse(
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
                user=user_profile,
                like_count=like_count,
                comment_count=comment_count,
                is_liked=is_liked
            )
            
        except Exception as e:
            logger.error(f"Error creating reading response for reading {reading.id}: {e}")
            raise DatabaseError(f"Failed to create reading response: {str(e)}")
    
    async def create_reading_responses(
        self,
        readings: List[Reading],
        current_user_id: int,
        db: AsyncSession
    ) -> List[ReadingResponse]:
        """
        Create multiple ReadingResponse objects efficiently
        
        Args:
            readings: List of reading instances
            current_user_id: Current user ID for social context
            db: Database session
            
        Returns:
            List of ReadingResponse objects
        """
        responses = []
        for reading in readings:
            try:
                response = await self.create_reading_response(reading, current_user_id, db)
                responses.append(response)
            except Exception as e:
                logger.warning(f"Failed to create response for reading {reading.id}: {e}")
                continue
        
        return responses
    
    def _handle_status_changes(self, reading: Reading, new_status: ReadingStatus):
        """Handle timestamp updates when status changes"""
        if new_status == ReadingStatus.CURRENTLY_READING and not reading.started_at:
            reading.started_at = datetime.utcnow()
        elif new_status == ReadingStatus.FINISHED:
            if not reading.started_at:
                reading.started_at = datetime.utcnow()
            reading.finished_at = datetime.utcnow()
            # Set progress to 100% when finished
            if reading.total_pages:
                reading.progress_pages = reading.total_pages
    
    async def _create_reading_activities(
        self,
        reading: Reading,
        user_id: int,
        db: AsyncSession,
        book: Book
    ):
        """Create user activities for reading creation"""
        activity_data = {
            "book_id": reading.book_id,
            "book_title": book.title,
            "book_author": book.author,
            "status": reading.status
        }
        
        if reading.status == ReadingStatus.FINISHED:
            await self._create_activity(db, user_id, "finished_book", activity_data)
            if reading.rating:
                activity_data["rating"] = reading.rating
                await self._create_activity(db, user_id, "rated_book", activity_data)
            if reading.review:
                activity_data["has_review"] = True
                await self._create_activity(db, user_id, "reviewed_book", activity_data)
    
    async def _create_update_activities(
        self,
        reading: Reading,
        user_id: int,
        old_status: str,
        old_rating: Optional[int],
        old_review: Optional[str],
        db: AsyncSession
    ):
        """Create user activities for reading updates"""
        activity_data = {
            "book_id": reading.book_id,
            "book_title": reading.book.title if reading.book else "Unknown",
            "book_author": reading.book.author if reading.book else "Unknown",
            "reading_id": reading.id
        }
        
        # Status change to finished
        if old_status != ReadingStatus.FINISHED and reading.status == ReadingStatus.FINISHED:
            await self._create_activity(db, user_id, "finished_book", activity_data)
        
        # New rating or rating change
        if reading.rating is not None and old_rating != reading.rating:
            activity_data["rating"] = reading.rating
            await self._create_activity(db, user_id, "rated_book", activity_data)
        
        # New review or review change
        if reading.review is not None and old_review != reading.review and reading.review:
            activity_data["has_review"] = True
            await self._create_activity(db, user_id, "reviewed_book", activity_data)
    
    async def _create_activity(
        self,
        db: AsyncSession,
        user_id: int,
        activity_type: str,
        activity_data: Dict[str, Any]
    ):
        """Helper function to create user activity"""
        activity = UserActivity(
            user_id=user_id,
            activity_type=activity_type,
            activity_data=activity_data
        )
        db.add(activity)

# Global instance
reading_service = ReadingService() 