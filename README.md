# Bookshelf AI - Smart Book Recommendation System

A production-ready full-stack web application that provides AI-powered personalized book recommendations with social features. Built with modern TypeScript, Next.js 14, and FastAPI with a comprehensive services architecture.

## 🚀 Features

### 📚 Core Features
- **AI-Powered Recommendations**: Personalized book suggestions using DeepSeek AI with detailed reasoning and confidence scoring
- **Comprehensive Reading Tracking**: Track progress, set goals, and monitor reading statistics
- **Social Reading Experience**: Follow users, share reviews, activity feeds, and social interactions
- **Advanced Book Management**: Organize by status, rate and review, track reading progress
- **Intelligent Search**: Open Library API integration with rich metadata and book discovery
- **Mobile-First Design**: Responsive UI with dedicated mobile components

### 🔥 Advanced Features
- **Public/Private Profiles**: Comprehensive profile management with privacy controls
- **Review System**: Public and private reviews with likes and social interactions
- **Activity Feeds**: Real-time user activity tracking and social engagement
- **Reading Analytics**: Detailed statistics, goals, and progress insights
- **Profile Pictures**: File upload with Supabase storage integration
- **Follow System**: Social connections with followers and following

## 🛠 Tech Stack

### Backend
- **FastAPI**: Modern async Python web framework
- **SQLAlchemy**: Async ORM with Supabase PostgreSQL
- **Services Architecture**: Centralized business logic with 72% code reduction
- **DeepSeek AI**: Advanced AI recommendations with reasoning
- **Supabase**: PostgreSQL database and file storage
- **Railway**: Production deployment with automatic GitHub integration

### Frontend
- **Next.js 14**: React framework with App Router and TypeScript
- **TypeScript**: Strict type safety with zero build errors
- **TailwindCSS**: Utility-first responsive design
- **NextAuth.js**: Google OAuth authentication
- **React Query v4**: Server state management and caching
- **Component Architecture**: 40+ organized components with mobile-first design

### Production Infrastructure
- **Database**: Supabase PostgreSQL with connection pooling
- **Storage**: Supabase Storage for file uploads
- **Backend Deployment**: Railway with environment variables
- **Frontend Deployment**: Vercel with automatic GitHub integration
- **Authentication**: Google OAuth with JWT tokens

## ⚡ Quick Start

### Prerequisites
- Python 3.8+ ([Download](https://python.org))
- Node.js 18+ ([Download](https://nodejs.org))
- PowerShell (Windows)

### Installation

1. **Clone and navigate to the project**
   ```powershell
   # Navigate to your project directory
   cd bookshelf-ai
   ```

2. **Run the setup script**
   ```powershell
   .\setup.ps1
   ```
   This automatically:
   - Creates Python virtual environment
   - Installs all dependencies (Python + Node.js)
   - Sets up environment configuration files
   - Configures database connection
   - Creates startup scripts

3. **Start the application**
   
   Open **TWO** PowerShell windows:
   
   **Terminal 1 - Backend:**
   ```powershell
   .\run-backend.ps1
   ```
   
   **Terminal 2 - Frontend:**
   ```powershell
   .\run-frontend.ps1
   ```

4. **Access the application**
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

## ⚙️ Configuration

### Backend Environment Variables
Configure in Railway dashboard for production or `backend/.env` for development:

```env
# AI Integration
DEEPSEEK_API_KEY=sk-your-deepseek-api-key

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Security
JWT_SECRET_KEY=your-secure-jwt-secret

# Storage (Supabase)
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### Frontend Environment Variables
Configure in `frontend/.env.local`:

```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# API Connection
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🏗 Architecture Overview

### Services Architecture (Refactored 2024)
The backend uses a centralized services architecture that reduced code complexity by 72%:

```
backend/services/
├── book_service.py        # Open Library integration, book management
├── reading_service.py     # Reading operations, statistics, social data
├── user_service.py        # User profiles, social relationships
├── storage_service.py     # Supabase file operations
└── validation_service.py  # Input validation and business rules
```

### Component Architecture (40+ Components)
```
frontend/components/
├── ui/              # Base components (Button, Card, Badge, etc.)
├── features/        # Business components (BookCard, RecommendationCard, etc.)
├── layout/          # Global layout (Header, Footer, MobileMenu, etc.)
├── mobile/          # Mobile-specific components
├── modal/           # Modal system components
├── social/          # Social feature components
└── marketing/       # Landing page components
```

### Database Models
- **Users**: Profiles, privacy settings, social relationships
- **Books**: Open Library integration, metadata, cover images
- **Readings**: Status tracking, progress, ratings, reviews
- **Social**: Followers, activity feeds, review interactions

## 📡 API Reference

### Authentication
- `POST /auth/google` - Google OAuth login
- `GET /auth/me` - Current user session

### Books & Reading
- `GET /books/search` - Search Open Library
- `POST /books/` - Add book to database
- `GET /readings/user/{user_id}` - User's reading list
- `POST /readings/` - Add to reading list
- `PUT /readings/{reading_id}` - Update reading status

### Social Features
- `POST /social/follow` - Follow user
- `GET /social/followers/{user_id}` - Get followers
- `GET /social/following/{user_id}` - Get following
- `GET /users/search` - Search users

### AI & Analytics
- `GET /recommendations/{user_id}` - Get AI recommendations
- `POST /recommendations/generate` - Generate new recommendations
- `GET /dashboard/{user_id}` - Reading statistics

### Profile Management
- `PUT /users/me` - Update profile
- `POST /users/me/profile-picture` - Upload profile picture

## 🚀 Development

### Frontend Development
```powershell
cd frontend

# Type checking (ALWAYS run before deployment)
npx tsc --noEmit

# Development server
npm run dev

# Production build test
npm run build

# Linting
npm run lint
```

### Backend Development
```powershell
cd backend

# Activate virtual environment
& ".\venv\Scripts\Activate.ps1"

# Start development server
python main.py

# Database management
python db_manager.py check          # Test connection
python db_manager.py create-tables  # Create/update schema
python db_manager.py reset          # Reset database (destructive)
```

### TypeScript Guidelines
- **Always validate**: Run `npx tsc --noEmit` before committing
- **Component props**: Follow strict interfaces and prop naming
- **Build validation**: Ensure zero TypeScript errors for deployment
- **Component organization**: Use proper folder structure (ui/, features/, layout/, etc.)

## 📱 Project Structure

```
bookshelf-ai/
├── backend/                    # FastAPI backend
│   ├── services/              # ✨ Business logic services (REFACTORED)
│   │   ├── book_service.py    # Open Library integration
│   │   ├── reading_service.py # Reading operations & statistics
│   │   ├── user_service.py    # User profiles & social features
│   │   ├── storage_service.py # Supabase file operations
│   │   └── validation_service.py # Input validation
│   ├── routers/               # API route handlers (SIMPLIFIED)
│   ├── models.py              # SQLAlchemy database models
│   ├── schemas.py             # Pydantic request/response schemas
│   ├── database.py            # Database connection setup
│   ├── error_handlers.py      # Custom exception handling
│   └── main.py                # FastAPI application
├── frontend/                  # Next.js frontend (✨ COMPREHENSIVE REFACTOR)
│   ├── app/                   # App router pages with type-safe components
│   │   ├── books/             # Book management with mobile-responsive design
│   │   ├── dashboard/         # Dashboard with optimized loading states
│   │   ├── recommendations/   # AI recommendations with proper TypeScript
│   │   ├── social/            # Social features and user interactions
│   │   └── user/[id]/         # User profiles with comprehensive editing
│   ├── components/            # 40+ React components (FULLY REFACTORED)
│   │   ├── ui/                # Base UI components (Button, Card, Badge, etc.)
│   │   ├── features/          # Feature components (BookCard, RecommendationCard, etc.)
│   │   ├── layout/            # Layout components (Header, Footer, MobileMenu, etc.)
│   │   ├── mobile/            # Mobile-specific components
│   │   ├── modal/             # Modal system components
│   │   ├── social/            # Social feature components
│   │   └── marketing/         # Landing page components
│   ├── lib/                   # Utility libraries with type-safe API client
│   ├── types/                 # Comprehensive TypeScript type definitions
│   └── contexts/              # React contexts for global state
├── run-backend.ps1            # Backend startup script
├── run-frontend.ps1           # Frontend startup script
└── setup.ps1                  # Initial project setup
```

## 🎯 Key Features in Detail

### AI Recommendations
- **DeepSeek AI Integration**: Advanced language model for personalized suggestions
- **Reading History Analysis**: Considers genres, authors, ratings, and reading patterns
- **Confidence Scoring**: Quality indicators for each recommendation
- **Detailed Reasoning**: Explanations for why books are recommended
- **Interactive Cards**: Add to library, dismiss recommendations

### Social Features
- **User Profiles**: Public/private profiles with comprehensive editing
- **Follow System**: Social connections with followers and following lists
- **Review System**: Public and private reviews with social interactions
- **Activity Feeds**: Real-time activity tracking and social engagement
- **Profile Pictures**: File upload with Supabase storage integration

### Reading Analytics
- **Progress Tracking**: Visual progress bars and page counting
- **Reading Goals**: Annual reading targets with progress monitoring
- **Statistics Dashboard**: Comprehensive reading insights and analytics
- **Status Management**: Want to read, currently reading, finished organization
- **Rating System**: 5-star rating with visual star displays

### Mobile Experience
- **Mobile-First Design**: Responsive components optimized for mobile
- **Dedicated Mobile Components**: Touch-optimized interfaces
- **Mobile Navigation**: Intuitive mobile menu and navigation system
- **Performance Optimized**: Fast loading and smooth interactions

## 🔧 Troubleshooting

### Common Issues

1. **TypeScript Build Errors**
   ```powershell
   cd frontend
   npx tsc --noEmit  # Check for type errors
   npm run build     # Test production build
   ```

2. **Python Environment Issues**
   ```powershell
   cd backend
   & ".\venv\Scripts\Activate.ps1"
   pip install -r requirements.txt
   ```

3. **Database Connection Issues**
   ```powershell
   cd backend
   python db_manager.py check  # Test Supabase connection
   ```

4. **Port Conflicts**
   ```powershell
   netstat -ano | findstr :3000  # Frontend port
   netstat -ano | findstr :8000  # Backend port
   ```

5. **PowerShell Execution Policy**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### Development Tips
- Always run TypeScript validation before committing
- Use proper component prop names as defined in interfaces
- Follow the services architecture for backend changes
- Test both mobile and desktop layouts
- Validate API responses with proper error handling

## 🌐 Production Deployment

### Current Production Setup
- **Backend**: Railway with automatic GitHub deployment
- **Frontend**: Vercel with automatic GitHub deployment  
- **Database**: Supabase PostgreSQL (shared dev/production)
- **Storage**: Supabase Storage for file uploads
- **Authentication**: Google OAuth with NextAuth.js

### Environment Variables
All production environment variables are configured in Railway dashboard and Vercel dashboard respectively. The application uses the same Supabase instance for both development and production.

## 📊 Recent Major Updates

### Frontend Architecture Overhaul (2024) ✅
- **Zero Build Errors**: Comprehensive TypeScript fixes and optimizations
- **40+ Components**: Organized into logical architecture (ui/, features/, layout/, etc.)
- **Mobile-First Design**: Dedicated mobile components with responsive architecture
- **Type Safety**: Strict TypeScript interfaces for all component props

### Services Architecture Refactoring (2024) ✅
- **72% Code Reduction**: Centralized business logic from scattered router files
- **5 Core Services**: book_service, reading_service, user_service, storage_service, validation_service
- **Better Maintainability**: DRY principles, consistent error handling, easier testing
- **Production Tested**: Successfully deployed and functioning

### Key Achievements
- **Component System**: Standardized UI system with strict type safety
- **Mobile Experience**: Enhanced mobile navigation and responsive design
- **Social Features**: Comprehensive social reading experience
- **AI Integration**: Advanced recommendation system with detailed reasoning
- **Build Process**: Automated validation and deployment pipeline

## 📜 License

This project is for educational and demonstration purposes.

## 🤝 Contributing

This is a production-ready demo application. For enhancements, consider:
- Real-time features with WebSockets
- Enhanced AI recommendation algorithms
- Advanced social features and community building
- Mobile app development with React Native
- Performance monitoring and analytics

---

**Experience the future of social reading with AI-powered recommendations!** 📚✨🚀

**Bookshelf AI** - Where technology meets the joy of reading. 