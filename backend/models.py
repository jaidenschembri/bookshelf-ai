from sqlalchemy import Column, Integer, BigInteger, String, Float, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    google_id = Column(String, unique=True, index=True)
    profile_picture_url = Column(String)  # From Google profile
    reading_goal = Column(Integer, default=12)  # books per year
    timezone = Column(String, default="UTC")
    email_verified = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    readings = relationship("Reading", back_populates="user")
    recommendations = relationship("Recommendation", back_populates="user")

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
    progress_pages = Column(Integer, default=0)
    total_pages = Column(Integer)
    started_at = Column(DateTime(timezone=True))
    finished_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="readings")
    book = relationship("Book", back_populates="readings")

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