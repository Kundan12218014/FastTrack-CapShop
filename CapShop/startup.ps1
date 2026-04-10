# ============================================================
#  CapShop -- Docker Startup Script
#  Usage:  .\startup.ps1
# ============================================================

Clear-Host
Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host "    CapShop  --  Starting Up with Docker" -ForegroundColor Green
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host ""

Write-Host "  Building and starting all containers in the background..." -ForegroundColor Cyan

docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  ==========================================" -ForegroundColor Green
    Write-Host "    All services started successfully!" -ForegroundColor Green
    Write-Host "  ==========================================" -ForegroundColor Green
    Write-Host "  Gateway     -->  http://localhost:5000" -ForegroundColor Cyan
    Write-Host "  Auth        -->  http://localhost:5001" -ForegroundColor Cyan
    Write-Host "  Catalog     -->  http://localhost:5002" -ForegroundColor Cyan
    Write-Host "  Orders      -->  http://localhost:5003" -ForegroundColor Cyan
    Write-Host "  Admin       -->  http://localhost:5004" -ForegroundColor Cyan
    Write-Host "  Frontend    -->  http://localhost:8080" -ForegroundColor White
    Write-Host ""
    Write-Host "  Note: Services may take a moment to fully boot" -ForegroundColor DarkGray
    Write-Host "  Use 'docker-compose logs -f' to see logs" -ForegroundColor DarkGray
    Write-Host "  Stop all:   .\stop.ps1   (or stop.bat)" -ForegroundColor DarkGray
    Write-Host "  ==========================================" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  [ERROR] Failed to start Docker containers." -ForegroundColor Red
    Write-Host "  ==========================================" -ForegroundColor Red
}
