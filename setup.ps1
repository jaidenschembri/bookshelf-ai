# Bookshelf AI Complete Setup Script
Write-Host "Setting up Bookshelf AI - Smart Book Recommender" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Check prerequisites
Write-Host ""
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found. Please install Python 3.8+ from https://python.org" -ForegroundColor Red
    Write-Host "After installing Python, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Found Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    Write-Host "After installing Node.js, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}

# Setup Backend
Write-Host ""
Write-Host "Setting up Python Backend..." -ForegroundColor Yellow
Set-Location backend

# Create virtual environment
Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
python -m venv venv

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& ".\venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

# Create .env file
if (-not (Test-Path ".env")) {
    Write-Host "Creating backend .env file..." -ForegroundColor Cyan
    $envContent = @"
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DATABASE_URL=sqlite+aiosqlite:///./bookshelf.db
CORS_ORIGINS=http://localhost:3000
JWT_SECRET_KEY=bookshelf-ai-secret-key-change-in-production
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
} else {
    Write-Host "Backend .env file already exists" -ForegroundColor Green
}

# Setup database and seed data
Write-Host "Setting up database with sample data..." -ForegroundColor Cyan
python seed_data.py

Write-Host "Backend setup complete!" -ForegroundColor Green

# Return to root and setup frontend
Set-Location ..

Write-Host ""
Write-Host "Setting up Next.js Frontend..." -ForegroundColor Yellow
Set-Location frontend

# Install dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
npm install

# Create .env.local file
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating frontend .env.local file..." -ForegroundColor Cyan
    $envLocalContent = @"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=bookshelf-ai-nextauth-secret-change-in-production
GOOGLE_CLIENT_ID=demo_google_client_id
GOOGLE_CLIENT_SECRET=demo_google_client_secret
NEXT_PUBLIC_API_URL=http://localhost:8000
"@
    $envLocalContent | Out-File -FilePath ".env.local" -Encoding UTF8
} else {
    Write-Host "Frontend .env.local file already exists" -ForegroundColor Green
}

Write-Host "Frontend setup complete!" -ForegroundColor Green

# Return to root
Set-Location ..

# Create run scripts
Write-Host ""
Write-Host "Creating run scripts..." -ForegroundColor Yellow

# Backend run script
$backendScript = @"
# Start Bookshelf AI Backend
Write-Host "Starting Bookshelf AI Backend..." -ForegroundColor Green
Set-Location backend
& ".\venv\Scripts\Activate.ps1"
Write-Host "Backend running at http://localhost:8000" -ForegroundColor Cyan
Write-Host "API docs at http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
python main.py
Set-Location ..
"@
$backendScript | Out-File -FilePath "run-backend.ps1" -Encoding UTF8

# Frontend run script
$frontendScript = @"
# Start Bookshelf AI Frontend
Write-Host "Starting Bookshelf AI Frontend..." -ForegroundColor Green
Set-Location frontend
Write-Host "Frontend running at http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
npm run dev
Set-Location ..
"@
$frontendScript | Out-File -FilePath "run-frontend.ps1" -Encoding UTF8

# Complete setup summary
Write-Host ""
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "===============" -ForegroundColor Green
Write-Host ""
Write-Host "What was set up:" -ForegroundColor Yellow
Write-Host "  - Python backend with FastAPI" -ForegroundColor Green
Write-Host "  - SQLite database with sample data" -ForegroundColor Green
Write-Host "  - Next.js frontend with TypeScript" -ForegroundColor Green
Write-Host "  - Environment configuration files" -ForegroundColor Green
Write-Host "  - Run scripts for easy startup" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host "  1. Open TWO PowerShell windows" -ForegroundColor Cyan
Write-Host "  2. In first window: .\run-backend.ps1" -ForegroundColor Cyan
Write-Host "  3. In second window: .\run-frontend.ps1" -ForegroundColor Cyan
Write-Host "  4. Open http://localhost:3000 in your browser" -ForegroundColor Cyan
Write-Host ""
Write-Host "Optional - For full functionality:" -ForegroundColor Yellow
Write-Host "  - Get DeepSeek API key from https://platform.deepseek.com/" -ForegroundColor Cyan
Write-Host "  - Add it to backend\.env file" -ForegroundColor Cyan
Write-Host "  - Set up Google OAuth (see README.md)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo data includes:" -ForegroundColor Yellow
Write-Host "  - Sample books with covers and metadata" -ForegroundColor Cyan
Write-Host "  - Demo user with reading history" -ForegroundColor Cyan
Write-Host "  - Ready for AI recommendations" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy reading!" -ForegroundColor Green 