# Start Bookshelf AI Backend
Write-Host "Starting Bookshelf AI Backend..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "backend\main.py")) {
    Write-Host "Error: Please run this script from the bookshelf-ai root directory" -ForegroundColor Red
    exit 1
}

Set-Location backend

# Check if virtual environment exists
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "Error: Virtual environment not found. Please run setup.ps1 first." -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Activate virtual environment
& ".\venv\Scripts\Activate.ps1"

Write-Host "Backend running at http://localhost:8000" -ForegroundColor Cyan
Write-Host "API docs at http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

# Start the server
python main.py

# Return to root directory when done
Set-Location ..
