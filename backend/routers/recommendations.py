from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List
import os
import httpx
from datetime import datetime
import json

from database import get_db
from models import User, Reading, Book, Recommendation
from schemas import RecommendationResponse, RecommendationCreate
from routers.books import search_open_library, BookCreate
from utils import parse_user_id, log_api_error, log_external_api_call, logger

router = APIRouter()

# DeepSeek API configuration
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"

async def analyze_user_reading_history(user_id: int, db: AsyncSession) -> dict:
    """Analyze user's reading history to understand preferences"""
    
    # Convert user_id to SQLite-compatible integer
    safe_user_id = parse_user_id(str(user_id))
    
    # Get user's finished readings with ratings
    result = await db.execute(
        select(Reading)
        .options(selectinload(Reading.book))
        .where(Reading.user_id == safe_user_id, Reading.status == "finished")
        .order_by(Reading.finished_at.desc())
    )
    readings = result.scalars().all()
    
    if not readings:
        return {
            "total_books": 0,
            "favorite_genres": [],
            "favorite_authors": [],
            "average_rating": 0,
            "reading_patterns": "No reading history available"
        }
    
    # Analyze patterns
    genres = {}
    authors = {}
    ratings = []
    
    for reading in readings:
        if reading.book.genre:
            genres[reading.book.genre] = genres.get(reading.book.genre, 0) + 1
        
        if reading.book.author:
            authors[reading.book.author] = authors.get(reading.book.author, 0) + 1
        
        if reading.rating:
            ratings.append(reading.rating)
    
    # Sort by frequency
    favorite_genres = sorted(genres.items(), key=lambda x: x[1], reverse=True)[:3]
    favorite_authors = sorted(authors.items(), key=lambda x: x[1], reverse=True)[:3]
    
    avg_rating = sum(ratings) / len(ratings) if ratings else 0
    
    return {
        "total_books": len(readings),
        "favorite_genres": [genre for genre, count in favorite_genres],
        "favorite_authors": [author for author, count in favorite_authors],
        "average_rating": round(avg_rating, 1),
        "recent_books": [
            {
                "title": reading.book.title,
                "author": reading.book.author,
                "rating": reading.rating,
                "genre": reading.book.genre
            }
            for reading in readings[:5]
        ]
    }

async def get_ai_recommendations(user_reading_history: List[dict], num_recommendations: int = 5) -> List[dict]:
    """Get AI-powered book recommendations using DeepSeek API"""
    
    if not DEEPSEEK_API_KEY:
        logger.warning("DeepSeek API key not configured, using fallback recommendations")
        return get_fallback_recommendations()
    
    if not user_reading_history:
        logger.warning("No reading history provided for recommendations")
        return get_fallback_recommendations()
    
    # Analyze user preferences from reading history
    high_rated_books = [r for r in user_reading_history if r.get('rating', 0) >= 4]
    favorite_genres = {}
    favorite_authors = {}
    
    for reading in user_reading_history:
        book = reading.get('book', {})
        genre = book.get('genre')
        author = book.get('author')
        rating = reading.get('rating', 0)
        
        if genre and rating >= 4:
            favorite_genres[genre] = favorite_genres.get(genre, 0) + 1
        if author and rating >= 4:
            favorite_authors[author] = favorite_authors.get(author, 0) + 1
    
    # Create detailed reading profile
    reading_profile = ""
    if high_rated_books:
        reading_profile += "HIGHLY RATED BOOKS (4-5 stars):\n"
        for reading in high_rated_books[:8]:
            book = reading.get('book', {})
            rating = reading.get('rating', 'N/A')
            reading_profile += f"• {book.get('title', 'Unknown')} by {book.get('author', 'Unknown')} ({book.get('genre', 'Unknown')}) - {rating}★\n"
    
    if favorite_genres:
        top_genres = sorted(favorite_genres.items(), key=lambda x: x[1], reverse=True)[:3]
        reading_profile += f"\nFAVORITE GENRES: {', '.join([g[0] for g in top_genres])}\n"
    
    if favorite_authors:
        top_authors = sorted(favorite_authors.items(), key=lambda x: x[1], reverse=True)[:3]
        reading_profile += f"FAVORITE AUTHORS: {', '.join([a[0] for a in top_authors])}\n"
    
    # Create comprehensive prompt
    prompt = f"""You are a professional book recommendation AI. Analyze this reader's profile and recommend {num_recommendations} books they would love.

READER PROFILE:
{reading_profile}

INSTRUCTIONS:
1. Recommend books that match their demonstrated preferences
2. Consider their favorite genres and authors
3. Look for similar themes, writing styles, or subject matter
4. Avoid books they've already read
5. Provide specific, personalized reasons for each recommendation
6. Rate your confidence (0.0-1.0) based on how well the book matches their taste

RESPONSE FORMAT (JSON):
{{
  "recommendations": [
    {{
      "title": "Book Title",
      "author": "Author Name", 
      "reason": "Detailed explanation of why this book matches their preferences based on their reading history",
      "confidence": 0.85,
      "genre": "Book Genre"
    }}
  ]
}}

Respond ONLY with valid JSON. Make recommendations thoughtful and personalized."""

    try:
        logger.info(f"Calling DeepSeek API for {len(user_reading_history)} books in reading history")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DEEPSEEK_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 1500,
                    "temperature": 0.8
                },
                timeout=45.0
            )
            
            log_external_api_call("deepseek", response.status_code, "chat/completions", response.status_code == 200)
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result["choices"][0]["message"]["content"]
                logger.info(f"DeepSeek API response received: {len(ai_response)} characters")
                
                # Try to parse JSON response
                try:
                    # Clean the response - sometimes AI adds markdown formatting
                    clean_response = ai_response.strip()
                    if clean_response.startswith('```json'):
                        clean_response = clean_response[7:]
                    if clean_response.endswith('```'):
                        clean_response = clean_response[:-3]
                    clean_response = clean_response.strip()
                    
                    parsed_response = json.loads(clean_response)
                    recommendations = parsed_response.get("recommendations", [])
                    
                    # Validate and clean recommendations
                    valid_recommendations = []
                    for rec in recommendations:
                        if all(key in rec for key in ['title', 'author', 'reason']):
                            valid_recommendations.append({
                                'title': rec['title'].strip(),
                                'author': rec['author'].strip(),
                                'reason': rec['reason'].strip(),
                                'confidence': float(rec.get('confidence', 0.7)),
                                'genre': rec.get('genre', 'Fiction')
                            })
                    
                    if valid_recommendations:
                        logger.info(f"Successfully parsed {len(valid_recommendations)} AI recommendations")
                        return valid_recommendations[:num_recommendations]
                    else:
                        logger.warning("No valid recommendations found in AI response")
                        
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse AI response as JSON: {e}")
                    logger.debug(f"AI response was: {ai_response[:500]}...")
                
                # Fallback: try simple text parsing
                return parse_text_recommendations(ai_response, num_recommendations)
                
            else:
                logger.error(f"DeepSeek API error: {response.status_code} - {response.text}")
                
    except Exception as e:
        log_api_error("deepseek_api_call", e)
    
    # Return fallback recommendations if all else fails
    logger.warning("Using fallback recommendations due to API issues")
    return get_fallback_recommendations()

def parse_text_recommendations(ai_response: str, num_recommendations: int) -> List[dict]:
    """Fallback parser for non-JSON AI responses"""
    recommendations = []
    lines = ai_response.split('\n')
    current_rec = {}
    
    for line in lines:
        line = line.strip()
        if line.startswith('Title:') or line.startswith('"title":'):
            if current_rec and 'title' in current_rec:
                recommendations.append(current_rec)
            current_rec = {'title': line.split(':', 1)[1].strip().strip('"')}
        elif line.startswith('Author:') or line.startswith('"author":'):
            current_rec['author'] = line.split(':', 1)[1].strip().strip('"')
        elif line.startswith('Reason:') or line.startswith('"reason":'):
            current_rec['reason'] = line.split(':', 1)[1].strip().strip('"')
        elif line.startswith('Confidence:') or line.startswith('"confidence":'):
            try:
                conf_str = line.split(':', 1)[1].strip().strip('"').strip(',')
                current_rec['confidence'] = float(conf_str)
            except (ValueError, TypeError):
                current_rec['confidence'] = 0.7
    
    if current_rec and 'title' in current_rec:
        recommendations.append(current_rec)
    
    # Fill in missing fields
    for rec in recommendations:
        if 'author' not in rec:
            rec['author'] = 'Unknown Author'
        if 'reason' not in rec:
            rec['reason'] = 'Recommended based on your reading preferences'
        if 'confidence' not in rec:
            rec['confidence'] = 0.7
    
    return recommendations[:num_recommendations]

def get_fallback_recommendations() -> List[dict]:
    """High-quality fallback recommendations for when AI is unavailable"""
    return [
        {
            "title": "The Seven Husbands of Evelyn Hugo",
            "author": "Taylor Jenkins Reid",
            "reason": "A captivating story about a reclusive Hollywood icon that combines romance, mystery, and compelling character development.",
            "confidence": 0.75,
            "genre": "Contemporary Fiction"
        },
        {
            "title": "Educated",
            "author": "Tara Westover",
            "reason": "A powerful memoir about education, family, and self-discovery that has resonated with millions of readers.",
            "confidence": 0.80,
            "genre": "Memoir"
        },
        {
            "title": "The Midnight Library",
            "author": "Matt Haig",
            "reason": "A thought-provoking novel about life's infinite possibilities that blends philosophy with accessible storytelling.",
            "confidence": 0.78,
            "genre": "Literary Fiction"
        }
    ]

@router.get("/", response_model=List[RecommendationResponse])
async def get_user_recommendations(
    user_id: int,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Get recommendations for a user"""
    
    # Convert user_id to SQLite-compatible integer
    safe_user_id = parse_user_id(str(user_id))
    
    # Get existing recommendations
    result = await db.execute(
        select(Recommendation)
        .options(selectinload(Recommendation.book))
        .where(Recommendation.user_id == safe_user_id)
        .where(Recommendation.is_dismissed == False)
        .limit(limit)
    )
    recommendations = result.scalars().all()
    
    return [RecommendationResponse.from_orm(rec) for rec in recommendations]

@router.post("/generate")
async def generate_recommendations(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Generate new AI recommendations for a user"""
    
    # Convert user_id to SQLite-compatible integer
    safe_user_id = parse_user_id(str(user_id))
    
    # Get user's reading history
    result = await db.execute(
        select(Reading)
        .options(selectinload(Reading.book))
        .where(Reading.user_id == safe_user_id)
        .limit(20)  # Last 20 books
    )
    readings = result.scalars().all()
    
    if not readings:
        raise HTTPException(
            status_code=400,
            detail="User has no reading history to base recommendations on"
        )
    
    # Prepare reading history for AI
    reading_history = []
    for reading in readings:
        reading_history.append({
            'status': reading.status,
            'rating': reading.rating,
            'book': {
                'title': reading.book.title,
                'author': reading.book.author,
                'genre': reading.book.genre
            }
        })
    
    # Get AI recommendations
    ai_recommendations = await get_ai_recommendations(reading_history)
    
    # Clear existing recommendations
    existing_recs = (await db.execute(
        select(Recommendation).where(Recommendation.user_id == safe_user_id)
    )).scalars().all()
    
    for rec in existing_recs:
        await db.delete(rec)
    
    # Create new recommendations
    created_recommendations = []
    for ai_rec in ai_recommendations:
        # Try to find existing book or create a placeholder
        book_result = await db.execute(
            select(Book).where(Book.title == ai_rec['title'])
        )
        book = book_result.scalar_one_or_none()
        
        if not book:
            # Create a new book entry
            book = Book(
                title=ai_rec['title'],
                author=ai_rec['author'],
                description=ai_rec['reason'],
                genre="Recommended"
            )
            db.add(book)
            await db.flush()
        
        # Create recommendation
        recommendation = Recommendation(
            user_id=safe_user_id,
            book_id=book.id,
            reason=ai_rec['reason'],
            confidence_score=ai_rec.get('confidence', 0.7),
            is_dismissed=False
        )
        db.add(recommendation)
        created_recommendations.append(recommendation)
    
    await db.commit()
    
    return {
        "message": f"Generated {len(created_recommendations)} new recommendations",
        "count": len(created_recommendations)
    }

@router.put("/{recommendation_id}/dismiss")
async def dismiss_recommendation(
    recommendation_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Dismiss a recommendation"""
    result = await db.execute(
        select(Recommendation).where(Recommendation.id == recommendation_id)
    )
    recommendation = result.scalar_one_or_none()
    
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    recommendation.is_dismissed = True
    await db.commit()
    
    return {"message": "Recommendation dismissed"} 