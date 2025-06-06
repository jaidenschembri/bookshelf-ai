# Start Bookshelf AI Frontend
Write-Host "Starting Bookshelf AI Frontend..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "frontend\package.json")) {
    Write-Host "Error: Please run this script from the bookshelf-ai root directory" -ForegroundColor Red
    exit 1
}

Set-Location frontend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Error: Dependencies not installed. Please run setup.ps1 first." -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "Frontend running at http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

# Start the development server
npm run dev

# Return to root directory when done
Set-Location ..
