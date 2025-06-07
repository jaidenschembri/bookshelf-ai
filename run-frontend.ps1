# Start Bookshelf AI Frontend
Write-Host "Starting Bookshelf AI Frontend..." -ForegroundColor Green
Set-Location frontend
Write-Host "Frontend running at http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
npm run dev
Set-Location ..
