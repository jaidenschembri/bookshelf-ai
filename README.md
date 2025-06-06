# Bookshelf AI - Smart Book Recommendation System

A full-stack web application that provides personalized book recommendations using AI, built with Next.js frontend and FastAPI backend.

## Features

- **Smart AI Recommendations**: Get personalized book suggestions based on your reading history using DeepSeek AI
- **Reading Progress Tracking**: Track your reading progress with visual progress bars
- **Personal Library Management**: Organize books by reading status (Want to Read, Currently Reading, Finished)
- **Book Search**: Search for books using the Open Library API with rich metadata
- **Rating & Reviews**: Rate books and write reviews to improve recommendations
- **Dashboard Analytics**: View reading statistics, goals, and progress insights
- **Google OAuth Authentication**: Secure login with Google accounts
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM with async support
- **SQLite**: Lightweight database
- **DeepSeek AI**: AI-powered book recommendations
- **Open Library API**: Book metadata and search
- **Pydantic**: Data validation and serialization

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **NextAuth.js**: Authentication library
- **React Query**: Data fetching and caching
- **Lucide React**: Beautiful icons

## Quick Start

### Prerequisites
- Python 3.8+ ([Download](https://python.org))
- Node.js 18+ ([Download](https://nodejs.org))
- PowerShell (Windows)

### Installation

1. **Clone or download the project**
   ```powershell
   # If you have the project files, navigate to the directory
   cd bookshelf-ai
   ```

2. **Run the setup script**
   ```powershell
   .\setup.ps1
   ```
   This will:
   - Install Python dependencies in a virtual environment
   - Install Node.js dependencies
   - Create environment configuration files
   - Set up the database with sample data
   - Create run scripts

3. **Start the application**
   
   Open **TWO** PowerShell windows:
   
   **Window 1 - Backend:**
   ```powershell
   .\run-backend.ps1
   ```
   
   **Window 2 - Frontend:**
   ```powershell
   .\run-frontend.ps1
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

### Backend Environment (.env)
Located in `backend/.env`:
```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DATABASE_URL=sqlite+aiosqlite:///./bookshelf.db
CORS_ORIGINS=http://localhost:3000
JWT_SECRET_KEY=bookshelf-ai-secret-key-change-in-production
```

### Frontend Environment (.env.local)
Located in `frontend/.env.local`:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=bookshelf-ai-nextauth-secret-change-in-production
GOOGLE_CLIENT_ID=demo_google_client_id
GOOGLE_CLIENT_SECRET=demo_google_client_secret
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Documentation

Once the backend is running, visit:
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### Main API Endpoints

- `GET /` - API status
- `POST /auth/google` - Google OAuth authentication
- `GET /books/search` - Search books via Open Library
- `GET /readings/` - Get user's reading list
- `POST /readings/` - Add book to reading list
- `GET /recommendations/` - Get AI recommendations
- `POST /recommendations/generate` - Generate new recommendations
- `GET /dashboard/{user_id}` - Get dashboard statistics

## Demo Data

The application comes with sample data including:
- 8 popular books with covers and metadata
- Demo user with reading history
- Sample reading progress and ratings

**Demo User Credentials:**
- Email: demo@bookshelf-ai.com
- Name: Demo User

## Optional Setup

### DeepSeek AI Integration
1. Get an API key from [DeepSeek Platform](https://platform.deepseek.com/)
2. Add it to `backend/.env`:
   ```env
   DEEPSEEK_API_KEY=your_actual_api_key_here
   ```

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Update `frontend/.env.local` with your credentials

## Project Structure

```
bookshelf-ai/
├── backend/                 # FastAPI backend
│   ├── routers/            # API route handlers
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── database.py         # Database configuration
│   ├── main.py            # FastAPI application
│   ├── seed_data.py       # Sample data script
│   └── requirements.txt   # Python dependencies
├── frontend/               # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/              # Utility functions
│   └── package.json      # Node.js dependencies
├── setup.ps1             # Setup script
├── run-backend.ps1       # Backend start script
├── run-frontend.ps1      # Frontend start script
└── README.md            # This file
```

## Development

### Backend Development
```powershell
cd backend
& ".\venv\Scripts\Activate.ps1"
python main.py
```

### Frontend Development
```powershell
cd frontend
npm run dev
```

### Database Management
```powershell
cd backend
& ".\venv\Scripts\Activate.ps1"
python seed_data.py  # Reset with sample data
```

## Troubleshooting

### Common Issues

1. **"Python not found"**
   - Install Python 3.8+ from python.org
   - Restart PowerShell after installation

2. **"Node.js not found"**
   - Install Node.js 18+ from nodejs.org
   - Restart PowerShell after installation

3. **"Cannot run scripts"**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. **Backend won't start**
   - Check if virtual environment is activated
   - Ensure all dependencies are installed: `pip install -r requirements.txt`

5. **Frontend won't start**
   - Check if dependencies are installed: `npm install`
   - Verify you're in the frontend directory

6. **Port already in use**
   - Backend (8000): `netstat -ano | findstr :8000`
   - Frontend (3000): `netstat -ano | findstr :3000`
   - Kill processes or use different ports

### Getting Help

If you encounter issues:
1. Check the console output for error messages
2. Verify all prerequisites are installed
3. Ensure you're running commands from the correct directory
4. Try running the setup script again

## Features in Detail

### AI Recommendations
- Analyzes your reading history and preferences
- Considers genres, authors, and ratings
- Provides detailed explanations for each recommendation
- Confidence scores for recommendation quality

### Reading Progress
- Visual progress bars for currently reading books
- Page tracking with slider controls
- Reading goals and statistics
- Time-based reading analytics

### Book Management
- Add books from search or manually
- Organize by reading status
- Rate and review completed books
- Track reading dates and duration

### Dashboard
- Reading statistics and insights
- Progress toward reading goals
- Recent activity timeline
- Genre and author preferences

## License

This project is for educational and demonstration purposes.

## Contributing

This is a demo application. For production use, consider:
- Implementing proper error handling
- Adding comprehensive testing
- Setting up proper authentication
- Using a production database
- Adding rate limiting and security measures
- Implementing proper logging and monitoring

---

**Happy Reading!** 📚✨ 