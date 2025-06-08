from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True)  # New: unique username for social features
    bio = Column(Text)  # New: user bio
    location = Column(String)  # New: user location
    
    # Authentication fields
    password_hash = Column(String)  # For email/password auth
    google_id = Column(String, unique=True, index=True)  # For Google OAuth (optional)
    auth_provider = Column(String, default="email")  # "email" or "google"
    
    profile_picture_url = Column(String)  # From Google profile or uploaded
    reading_goal = Column(Integer, default=12)  # books per year
    timezone = Column(String, default="UTC")
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String)  # For email verification
    password_reset_token = Column(String)  # For password resets
    password_reset_expires = Column(DateTime(timezone=True))  # Reset token expiry
    is_private = Column(Boolean, default=False)  # New: private profile option
    last_login = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    readings = relationship("Reading", back_populates="user")
    recommendations = relationship("Recommendation", back_populates="user")
    
    # Social relationships
    following = relationship("UserFollow", foreign_keys="UserFollow.follower_id", back_populates="follower")
    followers = relationship("UserFollow", foreign_keys="UserFollow.following_id", back_populates="following")
    review_likes = relationship("ReviewLike", back_populates="user")
    review_comments = relationship("ReviewComment", back_populates="user")
    activities = relationship("UserActivity", back_populates="user")

class Book(Base):
    __tablename__ = "books"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    author = Column(String, nullable=False)
    isbn = Column(String, unique=True, index=True)
    cover_url = Column(String)
    description = Column(Text)
    genre = Column(String)
    publication_year = Column(Integer)
    total_pages = Column(Integer)
    open_library_id = Column(String, unique=True, index=True)
    average_rating = Column(Float, default=0.0)  # New: calculated average rating
    total_ratings = Column(Integer, default=0)  # New: total number of ratings
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    readings = relationship("Reading", back_populates="book")
    recommendations = relationship("Recommendation", back_populates="book")

class Reading(Base):
    __tablename__ = "readings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    status = Column(String, nullable=False)  # want_to_read, currently_reading, finished
    rating = Column(Integer)  # 1-5 stars
    review = Column(Text)
    is_review_public = Column(Boolean, default=True)  # New: public/private review option
    progress_pages = Column(Integer, default=0)
    total_pages = Column(Integer)
    started_at = Column(DateTime(timezone=True))
    finished_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="readings")
    book = relationship("Book", back_populates="readings")
    likes = relationship("ReviewLike", back_populates="reading")
    comments = relationship("ReviewComment", back_populates="reading")

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    reason = Column(Text, nullable=False)  # AI explanation
    confidence_score = Column(Float, default=0.0)  # 0.0 to 1.0
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="recommendations")
    book = relationship("Book", back_populates="recommendations")

# New Social Features Models

class UserFollow(Base):
    __tablename__ = "user_follows"
    
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following = relationship("User", foreign_keys=[following_id], back_populates="followers")
    
    # Ensure unique follow relationships
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )

class ReviewLike(Base):
    __tablename__ = "review_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reading_id = Column(Integer, ForeignKey("readings.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="review_likes")
    reading = relationship("Reading", back_populates="likes")

class ReviewComment(Base):
    __tablename__ = "review_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reading_id = Column(Integer, ForeignKey("readings.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="review_comments")
    reading = relationship("Reading", back_populates="comments")

class UserActivity(Base):
    __tablename__ = "user_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String, nullable=False)  # 'finished_book', 'rated_book', 'reviewed_book', 'followed_user'
    activity_data = Column(JSON)  # Store activity-specific data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="activities") 