from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ReadingStatus(str, Enum):
    WANT_TO_READ = "want_to_read"
    CURRENTLY_READING = "currently_reading"
    FINISHED = "finished"

class ActivityType(str, Enum):
    FINISHED_BOOK = "finished_book"
    RATED_BOOK = "rated_book"
    REVIEWED_BOOK = "reviewed_book"
    FOLLOWED_USER = "followed_user"

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    username: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    reading_goal: Optional[int] = 12
    is_private: Optional[bool] = False

class UserCreate(UserBase):
    google_id: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    reading_goal: Optional[int] = None
    is_private: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    profile_picture_url: Optional[str] = None
    timezone: str = "UTC"
    email_verified: bool = False
    last_login: Optional[datetime] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserPublicProfile(BaseModel):
    id: int
    name: str
    username: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    profile_picture_url: Optional[str] = None
    reading_goal: int
    is_private: bool
    created_at: datetime
    follower_count: int = 0
    following_count: int = 0
    is_following: bool = False
    is_own_profile: bool = False
    can_edit: bool = False
    
    class Config:
        from_attributes = True

# Book schemas
class BookBase(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    cover_url: Optional[str] = None
    description: Optional[str] = None
    genre: Optional[str] = None
    publication_year: Optional[int] = None
    total_pages: Optional[int] = None

class BookCreate(BookBase):
    open_library_id: Optional[str] = None

class BookResponse(BookBase):
    id: int
    open_library_id: Optional[str] = None
    average_rating: float = 0.0
    total_ratings: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True

class BookSearch(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    cover_url: Optional[str] = None
    description: Optional[str] = None
    publication_year: Optional[int] = None
    open_library_key: Optional[str] = None

# Reading schemas
class ReadingBase(BaseModel):
    status: ReadingStatus
    rating: Optional[int] = None
    review: Optional[str] = None
    is_review_public: Optional[bool] = True
    progress_pages: Optional[int] = 0
    total_pages: Optional[int] = None

class ReadingCreate(ReadingBase):
    book_id: int

class ReadingUpdate(BaseModel):
    status: Optional[ReadingStatus] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    is_review_public: Optional[bool] = None
    progress_pages: Optional[int] = None
    total_pages: Optional[int] = None

class ReadingResponse(ReadingBase):
    id: int
    user_id: int
    book_id: int
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    book: BookResponse
    user: Optional[UserPublicProfile] = None
    like_count: int = 0
    comment_count: int = 0
    is_liked: bool = False
    
    class Config:
        from_attributes = True

# Social interaction schemas
class UserFollowCreate(BaseModel):
    following_id: int

class UserFollowResponse(BaseModel):
    id: int
    follower_id: int
    following_id: int
    created_at: datetime
    follower: UserPublicProfile
    following: UserPublicProfile
    
    class Config:
        from_attributes = True

class ReviewLikeResponse(BaseModel):
    id: int
    user_id: int
    reading_id: int
    created_at: datetime
    user: UserPublicProfile
    
    class Config:
        from_attributes = True

class ReviewCommentCreate(BaseModel):
    content: str

class ReviewCommentUpdate(BaseModel):
    content: str

class ReviewCommentResponse(BaseModel):
    id: int
    user_id: int
    reading_id: int
    content: str
    created_at: datetime
    updated_at: datetime
    user: UserPublicProfile
    
    class Config:
        from_attributes = True

class UserActivityResponse(BaseModel):
    id: int
    user_id: int
    activity_type: ActivityType
    activity_data: dict
    created_at: datetime
    user: UserPublicProfile
    
    class Config:
        from_attributes = True

# Recommendation schemas
class RecommendationBase(BaseModel):
    reason: str
    confidence_score: float

class RecommendationCreate(RecommendationBase):
    user_id: int
    book_id: int

class RecommendationResponse(RecommendationBase):
    id: int
    user_id: int
    book_id: int
    is_dismissed: bool
    created_at: datetime
    book: BookResponse
    
    class Config:
        from_attributes = True

# Dashboard schemas
class ReadingStats(BaseModel):
    total_books: int
    books_this_year: int
    currently_reading: int
    want_to_read: int
    finished: int
    average_rating: Optional[float] = None
    reading_goal: int
    goal_progress: float

class DashboardResponse(BaseModel):
    user: UserResponse
    stats: ReadingStats
    recent_readings: List[ReadingResponse]
    current_books: List[ReadingResponse]
    recent_recommendations: List[RecommendationResponse]

# Social feed schemas
class SocialFeedResponse(BaseModel):
    activities: List[UserActivityResponse]
    recent_reviews: List[ReadingResponse]

# Auth schemas
class GoogleAuthRequest(BaseModel):
    token: str

class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer" 