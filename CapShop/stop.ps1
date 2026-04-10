# ============================================================
#  CapShop -- Docker Stop Script
#  Usage:  .\stop.ps1
# ============================================================

Clear-Host
Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Red
Write-Host "    CapShop  --  Stopping All Services" -ForegroundColor Red
Write-Host "  ==========================================" -ForegroundColor Red
Write-Host ""

Write-Host "  Stopping and removing Docker containers..." -ForegroundColor Gray

docker-compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  [OK]  All Docker containers stopped and removed." -ForegroundColor Green
    Write-Host "  ==========================================" -ForegroundColor Red
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  [ERROR] Failed to stop Docker containers." -ForegroundColor Red
    Write-Host "  ==========================================" -ForegroundColor Red
    Write-Host ""
}
