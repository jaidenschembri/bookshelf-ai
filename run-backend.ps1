# Start Bookshelf AI Backend
Write-Host "Starting Bookshelf AI Backend..." -ForegroundColor Green
Set-Location backend
& ".\venv\Scripts\Activate.ps1"
Write-Host "Backend running at http://localhost:8000" -ForegroundColor Cyan
Write-Host "API docs at http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
python main.py
Set-Location ..
