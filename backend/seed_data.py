import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from database import AsyncSessionLocal, engine, Base
from models import User, Book, Reading, Recommendation
from datetime import datetime, timedelta
import random

async def create_sample_data():
    """Create sample data for demo purposes"""
    
    async with AsyncSessionLocal() as db:
        # Create sample books
        sample_books = [
            {
                "title": "The Seven Husbands of Evelyn Hugo",
                "author": "Taylor Jenkins Reid",
                "isbn": "9781501161933",
                "genre": "Contemporary Fiction",
                "publication_year": 2017,
                "total_pages": 400,
                "description": "A reclusive Hollywood icon finally tells her story to a young journalist.",
                "cover_url": "https://covers.openlibrary.org/b/isbn/9781501161933-M.jpg"
            },
            {
                "title": "The Midnight Library",
                "author": "Matt Haig",
                "isbn": "9780525559474",
                "genre": "Literary Fiction",
                "publication_year": 2020,
                "total_pages": 288,
                "description": "A novel about all the choices that go into a life well lived.",
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780525559474-M.jpg"
            },
            {
                "title": "Educated",
                "author": "Tara Westover",
                "isbn": "9780399590504",
                "genre": "Memoir",
                "publication_year": 2018,
                "total_pages": 334,
                "description": "A memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University.",
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780399590504-M.jpg"
            },
            {
                "title": "The Silent Patient",
                "author": "Alex Michaelides",
                "isbn": "9781250301697",
                "genre": "Psychological Thriller",
                "publication_year": 2019,
                "total_pages": 336,
                "description": "A woman's act of violence against her husband and her refusal to speak sends shockwaves through London.",
                "cover_url": "https://covers.openlibrary.org/b/isbn/9781250301697-M.jpg"
            },
            {
                "title": "Atomic Habits",
                "author": "James Clear",
                "isbn": "9780735211292",
                "genre": "Self-Help",
                "publication_year": 2018,
                "total_pages": 320,
                "description": "An easy and proven way to build good habits and break bad ones.",
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg"
            },
            {
                "title": "Where the Crawdads Sing",
                "author": "Delia Owens",
                "isbn": "9780735219090",
                "genre": "Literary Fiction",
                "publication_year": 2018,
                "total_pages": 384,
                "description": "A mystery about a young woman who raised herself in the marshes of the deep South.",
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780735219090-M.jpg"
            },
            {
                "title": "The Thursday Murder Club",
                "author": "Richard Osman",
                "isbn": "9781984880987",
                "genre": "Mystery",
                "publication_year": 2020,
                "total_pages": 368,
                "description": "Four unlikely friends meet weekly to investigate cold cases.",
                "cover_url": "https://covers.openlibrary.org/b/isbn/9781984880987-M.jpg"
            },
            {
                "title": "Klara and the Sun",
                "author": "Kazuo Ishiguro",
                "isbn": "9780593318171",
                "genre": "Science Fiction",
                "publication_year": 2021,
                "total_pages": 320,
                "description": "A story told from the perspective of an artificial friend observing the world.",
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780593318171-M.jpg"
            }
        ]
        
        # Create books
        books = []
        for book_data in sample_books:
            book = Book(**book_data)
            db.add(book)
            books.append(book)
        
        await db.commit()
        
        # Refresh to get IDs
        for book in books:
            await db.refresh(book)
        
        # Create a demo user with a SQLite-compatible ID
        demo_user = User(
            email="demo@bookshelf-ai.com",
            name="Demo User",
            google_id="demo_user_123",
            reading_goal=15
        )
        db.add(demo_user)
        await db.commit()
        await db.refresh(demo_user)
        
        # Create sample readings for the demo user
        statuses = ["finished", "currently_reading", "want_to_read"]
        ratings = [3, 4, 5, 4, 5, 3, 4]  # Some sample ratings
        
        for i, book in enumerate(books[:7]):  # Use first 7 books
            status = statuses[i % 3] if i < 6 else "currently_reading"
            
            reading_data = {
                "user_id": demo_user.id,
                "book_id": book.id,
                "status": status,
                "total_pages": book.total_pages,
                "progress_pages": book.total_pages if status == "finished" else random.randint(50, book.total_pages - 50) if status == "currently_reading" else 0
            }
            
            if status == "finished":
                reading_data["rating"] = ratings[i] if i < len(ratings) else 4
                reading_data["review"] = f"Great book! Really enjoyed reading {book.title}."
                reading_data["started_at"] = datetime.now() - timedelta(days=random.randint(30, 180))
                reading_data["finished_at"] = reading_data["started_at"] + timedelta(days=random.randint(7, 30))
            elif status == "currently_reading":
                reading_data["started_at"] = datetime.now() - timedelta(days=random.randint(1, 14))
            
            reading = Reading(**reading_data)
            db.add(reading)
        
        await db.commit()
        
        from utils import logger
        logger.info("Sample data created successfully!")
        logger.info(f"Created {len(books)} books")
        logger.info(f"Created demo user: {demo_user.email}")
        logger.info("You can now test the application with this sample data.")

async def main():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create sample data
    await create_sample_data()

if __name__ == "__main__":
    asyncio.run(main()) 