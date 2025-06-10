from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from datetime import datetime
import logging

from error_handlers import DatabaseError, ValidationError
from models import User, UserFollow, Reading, ReviewLike, ReviewComment, UserActivity
from schemas import (
    UserPublicProfile, UserUpdate, ReadingResponse, UserActivityResponse
)

logger = logging.getLogger(__name__)

class UserService:
    """Centralized service for all user operations"""
    
    async def get_user_by_id(
        self,
        user_id: int,
        db: AsyncSession,
        include_relations: bool = False
    ) -> Optional[User]:
        """
        Get user by ID with optional relations
        
        Args:
            user_id: User ID
            db: Database session
            include_relations: Whether to include relationships
            
        Returns:
            User instance or None
        """
        try:
            query = select(User)
            if include_relations:
                query = query.options(
                    selectinload(User.readings),
                    selectinload(User.following),
                    selectinload(User.followers)
                )
            
            result = await db.execute(query.where(User.id == user_id))
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error(f"Error fetching user {user_id}: {e}")
            raise DatabaseError(f"Failed to fetch user: {str(e)}")
    
    async def search_users(
        self,
        query: str,
        current_user_id: int,
        db: AsyncSession,
        limit: int = 20
    ) -> List[UserPublicProfile]:
        """
        Search for users by name or username
        
        Args:
            query: Search query
            current_user_id: Current user ID for social context
            db: Database session
            limit: Maximum results to return
            
        Returns:
            List of UserPublicProfile objects
        """
        try:
            # Search users by name or username
            search_pattern = f"%{query}%"
            result = await db.execute(
                select(User).where(
                    and_(
                        or_(
                            User.name.ilike(search_pattern),
                            User.username.ilike(search_pattern)
                        ),
                        User.id != current_user_id,  # Exclude current user
                        User.is_active == True
                    )
                ).limit(limit)
            )
            users = result.scalars().all()
            
            # Convert to public profiles with social data
            profiles = []
            for user in users:
                profile = await self.create_user_public_profile(
                    user, current_user_id, db
                )
                profiles.append(profile)
            
            return profiles
            
        except Exception as e:
            logger.error(f"Error searching users with query '{query}': {e}")
            raise DatabaseError(f"Failed to search users: {str(e)}")
    
    async def get_user_public_profile(
        self,
        user_id: int,
        current_user_id: int,
        db: AsyncSession
    ) -> Optional[UserPublicProfile]:
        """
        Get a user's public profile with social data
        
        Args:
            user_id: Target user ID
            current_user_id: Current user ID for social context
            db: Database session
            
        Returns:
            UserPublicProfile or None if user not found
        """
        try:
            user = await self.get_user_by_id(user_id, db)
            if not user:
                return None
            
            return await self.create_user_public_profile(user, current_user_id, db)
            
        except Exception as e:
            logger.error(f"Error getting public profile for user {user_id}: {e}")
            raise DatabaseError(f"Failed to get user profile: {str(e)}")
    
    async def create_user_public_profile(
        self,
        user: User,
        current_user_id: int,
        db: AsyncSession
    ) -> UserPublicProfile:
        """
        Create a UserPublicProfile with social data
        
        Args:
            user: User instance
            current_user_id: Current user ID for social context
            db: Database session
            
        Returns:
            Complete UserPublicProfile object
        """
        try:
            # Check if this is the current user's own profile
            is_own_profile = user.id == current_user_id
            
            # Check if current user is following this user (only relevant for other users)
            is_following = False if is_own_profile else await self.is_following(current_user_id, user.id, db)
            
            # Get follower and following counts
            follower_count = await self.get_follower_count(user.id, db)
            following_count = await self.get_following_count(user.id, db)
            
            return UserPublicProfile(
                id=user.id,
                name=user.name,
                username=user.username,
                bio=user.bio,
                location=user.location,
                profile_picture_url=user.profile_picture_url,
                reading_goal=user.reading_goal,
                is_private=user.is_private,
                created_at=user.created_at,
                follower_count=follower_count,
                following_count=following_count,
                is_following=is_following,
                is_own_profile=is_own_profile,
                can_edit=is_own_profile  # Can edit if it's your own profile
            )
            
        except Exception as e:
            logger.error(f"Error creating public profile for user {user.id}: {e}")
            raise DatabaseError(f"Failed to create user profile: {str(e)}")
    
    async def update_user_profile(
        self,
        user_id: int,
        update_data: UserUpdate,
        db: AsyncSession
    ) -> User:
        """
        Update user profile with validation
        
        Args:
            user_id: User ID to update
            update_data: Update data
            db: Database session
            
        Returns:
            Updated user instance
            
        Raises:
            ValidationError: If validation fails
            DatabaseError: If update fails
        """
        try:
            user = await self.get_user_by_id(user_id, db)
            if not user:
                raise ValidationError("User not found")
            
            # Validate and clean input data
            update_dict = update_data.dict(exclude_unset=True)
            
            # Validate username uniqueness if changed
            if 'username' in update_dict and update_dict['username'] != user.username:
                await self._validate_username_unique(update_dict['username'], user_id, db)
            
            # Update fields
            for field, value in update_dict.items():
                setattr(user, field, value)
            
            user.updated_at = datetime.utcnow()
            
            await db.commit()
            await db.refresh(user)
            
            logger.info(f"Updated profile for user {user_id}")
            return user
            
        except (ValidationError, DatabaseError):
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating user profile {user_id}: {e}")
            raise DatabaseError(f"Failed to update user profile: {str(e)}")
    
    async def update_profile_picture(
        self,
        user_id: int,
        profile_picture_url: str,
        db: AsyncSession
    ) -> User:
        """
        Update user's profile picture URL
        
        Args:
            user_id: User ID
            profile_picture_url: New profile picture URL
            db: Database session
            
        Returns:
            Updated user instance
        """
        try:
            user = await self.get_user_by_id(user_id, db)
            if not user:
                raise ValidationError("User not found")
            
            user.profile_picture_url = profile_picture_url
            user.updated_at = datetime.utcnow()
            
            await db.commit()
            await db.refresh(user)
            
            logger.info(f"Updated profile picture for user {user_id}")
            return user
            
        except (ValidationError, DatabaseError):
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating profile picture for user {user_id}: {e}")
            raise DatabaseError(f"Failed to update profile picture: {str(e)}")
    
    # Social Features
    
    async def follow_user(
        self,
        follower_id: int,
        following_id: int,
        db: AsyncSession
    ) -> UserFollow:
        """
        Create a follow relationship between users
        
        Args:
            follower_id: User who is following
            following_id: User being followed
            db: Database session
            
        Returns:
            UserFollow instance
            
        Raises:
            ValidationError: If invalid follow attempt
            DatabaseError: If creation fails
        """
        try:
            if follower_id == following_id:
                raise ValidationError("Cannot follow yourself")
            
            # Check if user to follow exists
            user_to_follow = await self.get_user_by_id(following_id, db)
            if not user_to_follow:
                raise ValidationError("User not found")
            
            # Check if already following
            existing_follow = await self._get_follow_relationship(follower_id, following_id, db)
            if existing_follow:
                raise ValidationError("Already following this user")
            
            # Create follow relationship
            new_follow = UserFollow(
                follower_id=follower_id,
                following_id=following_id
            )
            db.add(new_follow)
            
            # Create activity
            await self._create_follow_activity(follower_id, user_to_follow, db)
            
            await db.commit()
            await db.refresh(new_follow)
            
            logger.info(f"User {follower_id} followed user {following_id}")
            return new_follow
            
        except (ValidationError, DatabaseError):
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating follow relationship {follower_id} -> {following_id}: {e}")
            raise DatabaseError(f"Failed to follow user: {str(e)}")
    
    async def unfollow_user(
        self,
        follower_id: int,
        following_id: int,
        db: AsyncSession
    ) -> bool:
        """
        Remove a follow relationship between users
        
        Args:
            follower_id: User who is unfollowing
            following_id: User being unfollowed
            db: Database session
            
        Returns:
            True if unfollowed successfully
            
        Raises:
            ValidationError: If not following
            DatabaseError: If deletion fails
        """
        try:
            follow_relationship = await self._get_follow_relationship(follower_id, following_id, db)
            if not follow_relationship:
                raise ValidationError("Not following this user")
            
            await db.delete(follow_relationship)
            await db.commit()
            
            logger.info(f"User {follower_id} unfollowed user {following_id}")
            return True
            
        except (ValidationError, DatabaseError):
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            logger.error(f"Error removing follow relationship {follower_id} -> {following_id}: {e}")
            raise DatabaseError(f"Failed to unfollow user: {str(e)}")
    
    async def get_followers(
        self,
        user_id: int,
        current_user_id: int,
        db: AsyncSession
    ) -> List[UserPublicProfile]:
        """
        Get a user's followers
        
        Args:
            user_id: Target user ID
            current_user_id: Current user ID for social context
            db: Database session
            
        Returns:
            List of UserPublicProfile objects
        """
        try:
            result = await db.execute(
                select(UserFollow)
                .options(selectinload(UserFollow.follower))
                .where(UserFollow.following_id == user_id)
            )
            follows = result.scalars().all()
            
            followers = []
            for follow in follows:
                profile = await self.create_user_public_profile(
                    follow.follower, current_user_id, db
                )
                followers.append(profile)
            
            return followers
            
        except Exception as e:
            logger.error(f"Error getting followers for user {user_id}: {e}")
            raise DatabaseError(f"Failed to get followers: {str(e)}")
    
    async def get_following(
        self,
        user_id: int,
        current_user_id: int,
        db: AsyncSession
    ) -> List[UserPublicProfile]:
        """
        Get users that a user is following
        
        Args:
            user_id: Target user ID
            current_user_id: Current user ID for social context
            db: Database session
            
        Returns:
            List of UserPublicProfile objects
        """
        try:
            result = await db.execute(
                select(UserFollow)
                .options(selectinload(UserFollow.following))
                .where(UserFollow.follower_id == user_id)
            )
            follows = result.scalars().all()
            
            following = []
            for follow in follows:
                profile = await self.create_user_public_profile(
                    follow.following, current_user_id, db
                )
                following.append(profile)
            
            return following
            
        except Exception as e:
            logger.error(f"Error getting following for user {user_id}: {e}")
            raise DatabaseError(f"Failed to get following: {str(e)}")
    
    async def get_user_reviews(
        self,
        user_id: int,
        current_user_id: int,
        db: AsyncSession,
        limit: int = 20
    ) -> List[ReadingResponse]:
        """
        Get a user's public reviews with social data
        
        Args:
            user_id: Target user ID
            current_user_id: Current user ID for social context
            db: Database session
            limit: Maximum results to return
            
        Returns:
            List of ReadingResponse objects
        """
        try:
            # Get public reviews only
            result = await db.execute(
                select(Reading)
                .options(
                    selectinload(Reading.book),
                    selectinload(Reading.user)
                )
                .where(
                    and_(
                        Reading.user_id == user_id,
                        Reading.is_review_public == True,
                        Reading.review.isnot(None)
                    )
                )
                .order_by(desc(Reading.updated_at))
                .limit(limit)
            )
            readings = result.scalars().all()
            
            # Use reading service to create responses with social data
            # Import here to avoid circular imports
            from .reading_service import reading_service
            return await reading_service.create_reading_responses(readings, current_user_id, db)
            
        except Exception as e:
            logger.error(f"Error getting reviews for user {user_id}: {e}")
            raise DatabaseError(f"Failed to get user reviews: {str(e)}")
    
    # Helper Methods
    
    async def is_following(
        self,
        follower_id: int,
        following_id: int,
        db: AsyncSession
    ) -> bool:
        """Check if one user is following another"""
        try:
            result = await db.execute(
                select(UserFollow).where(
                    and_(
                        UserFollow.follower_id == follower_id,
                        UserFollow.following_id == following_id
                    )
                )
            )
            return result.scalar_one_or_none() is not None
            
        except Exception as e:
            logger.error(f"Error checking follow status {follower_id} -> {following_id}: {e}")
            return False
    
    async def get_follower_count(self, user_id: int, db: AsyncSession) -> int:
        """Get the number of followers for a user"""
        try:
            result = await db.execute(
                select(func.count(UserFollow.id)).where(UserFollow.following_id == user_id)
            )
            return result.scalar() or 0
            
        except Exception as e:
            logger.error(f"Error getting follower count for user {user_id}: {e}")
            return 0
    
    async def get_following_count(self, user_id: int, db: AsyncSession) -> int:
        """Get the number of users a user is following"""
        try:
            result = await db.execute(
                select(func.count(UserFollow.id)).where(UserFollow.follower_id == user_id)
            )
            return result.scalar() or 0
            
        except Exception as e:
            logger.error(f"Error getting following count for user {user_id}: {e}")
            return 0
    
    async def _get_follow_relationship(
        self,
        follower_id: int,
        following_id: int,
        db: AsyncSession
    ) -> Optional[UserFollow]:
        """Get follow relationship between two users"""
        try:
            result = await db.execute(
                select(UserFollow).where(
                    and_(
                        UserFollow.follower_id == follower_id,
                        UserFollow.following_id == following_id
                    )
                )
            )
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error(f"Error getting follow relationship {follower_id} -> {following_id}: {e}")
            return None
    
    async def _validate_username_unique(
        self,
        username: str,
        exclude_user_id: int,
        db: AsyncSession
    ):
        """Validate that username is unique"""
        result = await db.execute(
            select(User).where(
                and_(
                    User.username == username,
                    User.id != exclude_user_id
                )
            )
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise ValidationError("Username already taken")
    
    async def _create_follow_activity(
        self,
        follower_id: int,
        followed_user: User,
        db: AsyncSession
    ):
        """Create user activity for following someone"""
        activity = UserActivity(
            user_id=follower_id,
            activity_type="followed_user",
            activity_data={
                "followed_user_id": followed_user.id,
                "followed_user_name": followed_user.name
            }
        )
        db.add(activity)

# Global instance
user_service = UserService() 