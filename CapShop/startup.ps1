# ============================================================
#  CapShop -- Startup Script
#  Usage:  .\startup.ps1
# ============================================================

$Root     = $PSScriptRoot
$Backend  = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$PidFile  = Join-Path $Root ".capshop-pids"

$Services = [ordered]@{
    "AuthService"    = Join-Path $Backend "Services\AuthService\CapShop.AuthService"
    "CatalogService" = Join-Path $Backend "Services\CatalogService\CapShop.CatalogService"
    "OrderService"   = Join-Path $Backend "Services\OrderService\CapShop.OrderService"
    "AdminService"   = Join-Path $Backend "Services\AdminService\CapShop.AdminService"
    "Gateway"        = Join-Path $Backend "Gateway\CapShop.Gateway"
}

$Ports = @{
    "AuthService"    = 5001
    "CatalogService" = 5002
    "OrderService"   = 5003
    "AdminService"   = 5004
    "Gateway"        = 5000
}

$Colors = @{
    "AuthService"    = "Cyan"
    "CatalogService" = "Green"
    "OrderService"   = "Yellow"
    "AdminService"   = "Magenta"
    "Gateway"        = "Blue"
}

# ── Guard: already running? ───────────────────────────────────────────────────

if (Test-Path $PidFile) {
    Write-Host ""
    Write-Host "  CapShop may already be running." -ForegroundColor Yellow
    Write-Host "  Run .\stop.ps1 first, or press Y to start anyway." -ForegroundColor DarkYellow
    $confirm = Read-Host "  Continue? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") { exit 0 }
    Remove-Item $PidFile -Force
}

Clear-Host
Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host "    CapShop  --  Starting Up" -ForegroundColor Green
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host ""

$Pids = @()

# ── Start .NET microservices ──────────────────────────────────────────────────

Write-Host "  Starting backend services..." -ForegroundColor Cyan
Write-Host ""

foreach ($Name in $Services.Keys) {
    $Dir  = $Services[$Name]
    $Port = $Ports[$Name]
    $Col  = $Colors[$Name]

    if (-not (Test-Path $Dir)) {
        Write-Host "  [SKIP]  $Name  -- directory not found: $Dir" -ForegroundColor Red
        continue
    }

    $proc = Start-Process "dotnet" `
        -ArgumentList "run --project `"$Dir`" --launch-profile https" `
        -WorkingDirectory $Dir `
        -WindowStyle Normal `
        -PassThru

    $Pids += $proc.Id
    $label = "$Name (port $Port)".PadRight(30)
    Write-Host "  [OK]    $label  PID $($proc.Id)" -ForegroundColor $Col
    Start-Sleep -Milliseconds 600
}

# ── Wait before starting frontend ─────────────────────────────────────────────

Write-Host ""
Write-Host "  Waiting 10 s for services to initialize..." -ForegroundColor DarkCyan
Start-Sleep -Seconds 10

# ── Start Vite frontend ───────────────────────────────────────────────────────

Write-Host ""
Write-Host "  Starting frontend (Vite)..." -ForegroundColor White

if (Test-Path $Frontend) {
    $proc = Start-Process "npm.cmd" `
        -ArgumentList "run dev" `
        -WorkingDirectory $Frontend `
        -WindowStyle Normal `
        -PassThru

    $Pids += $proc.Id
    Write-Host "  [OK]    Frontend (port 5173)              PID $($proc.Id)" -ForegroundColor White
} else {
    Write-Host "  [SKIP]  Frontend directory not found: $Frontend" -ForegroundColor Red
}

# ── Save PIDs ─────────────────────────────────────────────────────────────────

$Pids | Out-File -FilePath $PidFile -Encoding UTF8
Write-Host ""
Write-Host "  PIDs saved to .capshop-pids" -ForegroundColor DarkGray

# ── Summary ───────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host "    All services running!" -ForegroundColor Green
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host "  Gateway     -->  https://localhost:5000" -ForegroundColor Cyan
Write-Host "  Auth        -->  https://localhost:5001" -ForegroundColor Cyan
Write-Host "  Catalog     -->  https://localhost:5002" -ForegroundColor Cyan
Write-Host "  Orders      -->  https://localhost:5003" -ForegroundColor Cyan
Write-Host "  Admin       -->  https://localhost:5004" -ForegroundColor Cyan
Write-Host "  Frontend    -->  http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "  Stop all:   .\stop.ps1   (or stop.bat)" -ForegroundColor DarkGray
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host ""
