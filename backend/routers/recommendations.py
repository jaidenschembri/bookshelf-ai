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
from routers.auth import get_current_user
from utils import parse_user_id, log_api_error, log_external_api_call, logger

router = APIRouter()

# DeepSeek API configuration
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"

def get_deepseek_api_key():
    """Get DeepSeek API key, ensuring environment variables are loaded"""
    from dotenv import load_dotenv
    load_dotenv()
    return os.getenv("DEEPSEEK_API_KEY")

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

async def get_ai_recommendations(user_reading_history: List[dict], user_books: List[dict] = None, num_recommendations: int = 5) -> List[dict]:
    """Get AI-powered book recommendations using DeepSeek API"""
    
    DEEPSEEK_API_KEY = get_deepseek_api_key()
    
    if not DEEPSEEK_API_KEY:
        logger.warning("DeepSeek API key not configured, using fallback recommendations")
        return get_fallback_recommendations()
    
    logger.info(f"DeepSeek API key found, proceeding with AI recommendations")
    
    if not user_reading_history:
        logger.warning("No reading history provided for recommendations")
        return get_fallback_recommendations()
    
    # Analyze user preferences from reading history
    high_rated_books = [r for r in user_reading_history if r.get('rating') and r.get('rating', 0) >= 4]
    favorite_genres = {}
    favorite_authors = {}
    
    for reading in user_reading_history:
        book = reading.get('book', {})
        genre = book.get('genre')
        author = book.get('author')
        rating = reading.get('rating')
        
        if genre and rating and rating >= 4:
            favorite_genres[genre] = favorite_genres.get(genre, 0) + 1
        if author and rating and rating >= 4:
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
    
    # Add complete list of books in user's library to avoid recommending them
    if user_books:
        reading_profile += f"\nBOOKS ALREADY IN LIBRARY (DO NOT RECOMMEND):\n"
        for book in user_books:
            reading_profile += f"• {book.get('title', 'Unknown')} by {book.get('author', 'Unknown')}\n"
    
    # Create comprehensive prompt
    prompt = f"""You are an expert literary curator and book recommendation specialist. Your task is to analyze this reader's unique profile and recommend {num_recommendations} exceptional books they will genuinely love.

READER PROFILE:
{reading_profile}

CRITICAL REQUIREMENTS:
• ABSOLUTELY NEVER recommend any book from the "BOOKS ALREADY IN LIBRARY" section above
• Only suggest books that are NOT in their current collection
• Each recommendation must be a real, published book with accurate title and author
• Focus on books published within the last 20 years for relevance and availability

RECOMMENDATION STRATEGY:
1. PATTERN ANALYSIS: Identify specific themes, writing styles, and narrative elements from their highly-rated books
2. GENRE EXPANSION: If they love one genre, suggest acclaimed books from adjacent genres they might enjoy
3. AUTHOR DISCOVERY: Recommend books by authors similar to their favorites, or newer works by authors they haven't discovered
4. THEMATIC CONNECTIONS: Look for books that share emotional resonance, character types, or subject matter with their favorites
5. QUALITY FOCUS: Prioritize critically acclaimed, award-winning, or widely beloved books that match their taste profile

PERSONALIZATION DEPTH:
• Reference specific books they've rated highly in your reasoning
• Explain WHY each book connects to their demonstrated preferences
• Consider their reading level and complexity preferences based on their history
• Account for both popular and literary fiction preferences if evident

CONFIDENCE SCORING:
• 0.9-1.0: Perfect match based on multiple preference indicators
• 0.8-0.89: Strong match with clear preference alignment
• 0.7-0.79: Good match with some preference overlap
• 0.6-0.69: Moderate match worth trying
• Below 0.6: Don't recommend

RESPONSE FORMAT (JSON only):
{{
  "recommendations": [
    {{
      "title": "Exact Book Title",
      "author": "Full Author Name",
      "reason": "Compelling, specific explanation connecting this book to their reading history and preferences, mentioning specific books they've enjoyed",
      "confidence": 0.85,
      "genre": "Primary Genre"
    }}
  ]
}}

Return ONLY valid JSON. No markdown, no explanations, just the JSON object."""

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
                        # Filter out books that are already in the user's library (same title + author)
                        if user_books:
                            user_book_combos = set()
                            for book in user_books:
                                # Only match title + author combination (not title alone)
                                title = book.get('title', '').lower().strip()
                                author = book.get('author', '').lower().strip()
                                user_book_combos.add(f"{title}|{author}")
                        
                            filtered_recommendations = []
                            for rec in valid_recommendations:
                                rec_title = rec['title'].lower().strip()
                                rec_author = rec['author'].lower().strip()
                                rec_combo = f"{rec_title}|{rec_author}"
                                
                                if rec_combo not in user_book_combos:
                                    filtered_recommendations.append(rec)
                                else:
                                    logger.info(f"Filtered out book already in library: {rec['title']} by {rec['author']}")
                            
                            valid_recommendations = filtered_recommendations
                        
                        if valid_recommendations:
                            logger.info(f"Successfully parsed {len(valid_recommendations)} AI recommendations after filtering")
                            return valid_recommendations[:num_recommendations]
                        else:
                            logger.warning("No valid recommendations found after filtering existing books")
                        
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
    fallback_recs = get_fallback_recommendations()
    
    # Filter fallback recommendations too (only by title + author combination)
    if user_books:
        user_book_combos = set()
        for book in user_books:
            title = book.get('title', '').lower().strip()
            author = book.get('author', '').lower().strip()
            user_book_combos.add(f"{title}|{author}")
        
        filtered_fallback = []
        for rec in fallback_recs:
            rec_title = rec['title'].lower().strip()
            rec_author = rec['author'].lower().strip()
            rec_combo = f"{rec_title}|{rec_author}"
            
            if rec_combo not in user_book_combos:
                filtered_fallback.append(rec)
        
        if filtered_fallback:
            return filtered_fallback
    
    return fallback_recs

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
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get recommendations for the current authenticated user"""
    
    # Get existing recommendations for the current user
    result = await db.execute(
        select(Recommendation)
        .options(selectinload(Recommendation.book))
        .where(
            Recommendation.user_id == current_user.id,
            Recommendation.is_dismissed == False
        )
        .order_by(Recommendation.confidence_score.desc(), Recommendation.created_at.desc())
        .limit(limit)
    )
    recommendations = result.scalars().all()
    
    # Manually create response objects to avoid async issues
    recommendations_response = []
    for rec in recommendations:
        recommendations_response.append(RecommendationResponse(
            id=rec.id,
            user_id=rec.user_id,
            book_id=rec.book_id,
            reason=rec.reason,
            score=rec.confidence_score,
            is_dismissed=rec.is_dismissed,
            created_at=rec.created_at,
            book=rec.book
        ))
    
    return recommendations_response

@router.post("/generate")
async def generate_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate new AI recommendations for the current authenticated user"""
    
    try:
        # Clear existing recommendations for this user
        await db.execute(
            select(Recommendation).where(Recommendation.user_id == current_user.id)
        )
        existing_recs = await db.execute(
            select(Recommendation).where(Recommendation.user_id == current_user.id)
        )
        for rec in existing_recs.scalars().all():
            await db.delete(rec)
        
        # Get user's reading history
        result = await db.execute(
            select(Reading)
            .options(selectinload(Reading.book))
            .where(Reading.user_id == current_user.id)
            .order_by(Reading.updated_at.desc())
        )
        user_readings = result.scalars().all()
        
        # Get all books in user's library to avoid recommending them
        result = await db.execute(
            select(Book)
            .join(Reading)
            .where(Reading.user_id == current_user.id)
        )
        user_books = result.scalars().all()
        
        # Convert to format expected by AI function
        reading_history = []
        for reading in user_readings:
            reading_history.append({
                "book": {
                    "title": reading.book.title,
                    "author": reading.book.author,
                    "genre": reading.book.genre,
                    "description": reading.book.description
                },
                "rating": reading.rating,
                "status": reading.status,
                "review": reading.review
            })
        
        user_books_list = []
        for book in user_books:
            user_books_list.append({
                "title": book.title,
                "author": book.author
            })
        
        # Get AI recommendations
        ai_recommendations = await get_ai_recommendations(
            reading_history, 
            user_books_list, 
            num_recommendations=8
        )
        
        # Process and save recommendations
        saved_recommendations = []
        for ai_rec in ai_recommendations:
            try:
                # Search for the book in Open Library
                search_results = await search_open_library(f"{ai_rec['title']} {ai_rec['author']}")
                
                if search_results:
                    # Use the first search result
                    book_data = search_results[0]
                    
                    # Check if book already exists in our database
                    result = await db.execute(
                        select(Book).where(
                            Book.title == book_data.title,
                            Book.author == book_data.author
                        )
                    )
                    existing_book = result.scalar_one_or_none()
                    
                    if existing_book:
                        book = existing_book
                    else:
                        # Create new book entry
                        book = Book(
                            title=book_data.title,
                            author=book_data.author,
                            isbn=book_data.isbn,
                            cover_url=book_data.cover_url,
                            description=book_data.description,
                            publication_year=book_data.publication_year,
                            open_library_id=book_data.open_library_key
                        )
                        db.add(book)
                        await db.commit()
                        await db.refresh(book)
                    
                    # Create recommendation
                    recommendation = Recommendation(
                        user_id=current_user.id,
                        book_id=book.id,
                        reason=ai_rec['reason'],
                        confidence_score=ai_rec['confidence'],
                        is_dismissed=False
                    )
                    db.add(recommendation)
                    saved_recommendations.append(recommendation)
                    
            except Exception as e:
                logger.error(f"Error processing recommendation for {ai_rec['title']}: {e}")
                continue
        
        await db.commit()
        
        # Refresh all recommendations to get the book data
        for rec in saved_recommendations:
            await db.refresh(rec)
        
        return {
            "message": f"Generated {len(saved_recommendations)} new recommendations",
            "count": len(saved_recommendations)
        }
        
    except Exception as e:
        logger.error(f"Error generating recommendations for user {current_user.id}: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )

@router.put("/{recommendation_id}/dismiss")
async def dismiss_recommendation(
    recommendation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Dismiss a recommendation for the current authenticated user"""
    
    # Get the recommendation and verify it belongs to the current user
    result = await db.execute(
        select(Recommendation).where(
            Recommendation.id == recommendation_id,
            Recommendation.user_id == current_user.id
        )
    )
    recommendation = result.scalar_one_or_none()
    
    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found or doesn't belong to you"
        )
    
    recommendation.is_dismissed = True
    await db.commit()
    
    return {"message": "Recommendation dismissed successfully"} 