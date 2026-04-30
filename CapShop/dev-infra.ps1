# =============================================================================
#  CapShop - Infrastructure startup
#  Starts Redis and RabbitMQ.
#  SQL Server uses your local .\SQLEXPRESS install (Windows auth).
#
#  Prefers Docker if available, falls back to winget installs.
#
#  Usage:
#    .\dev-infra.ps1          # start infra
#    .\dev-infra.ps1 -Stop    # stop Redis + RabbitMQ
# =============================================================================
param([switch]$Stop)

$ErrorActionPreference = "Continue"

function Write-Ok([string]$text) { Write-Host "  [OK]  $text" -ForegroundColor Green }
function Write-Warn([string]$text) { Write-Host "  [!!]  $text" -ForegroundColor Yellow }
function Write-Info([string]$text) { Write-Host "  [..]  $text" -ForegroundColor DarkGray }
function Write-Err([string]$text) { Write-Host "  [XX]  $text" -ForegroundColor Red }

$hasDocker = (Get-Command docker -ErrorAction SilentlyContinue) -ne $null

# ── Stop mode ─────────────────────────────────────────────────────────────────
if ($Stop) {
  Write-Host ""
  Write-Host "  Stopping infrastructure..." -ForegroundColor Red
  if ($hasDocker) {
    docker stop capshop-redis capshop-rabbitmq 2>$null
    docker rm   capshop-redis capshop-rabbitmq 2>$null
  }
  # Stop Windows services if they exist
  $rSvc = Get-Service "Redis"    -ErrorAction SilentlyContinue
  $qSvc = Get-Service "RabbitMQ" -ErrorAction SilentlyContinue
  if ($rSvc -and $rSvc.Status -eq "Running") { Stop-Service "Redis"    -Force -ErrorAction SilentlyContinue }
  if ($qSvc -and $qSvc.Status -eq "Running") { Stop-Service "RabbitMQ" -Force -ErrorAction SilentlyContinue }
  Write-Ok "Infrastructure stopped."
  Write-Host "  (SQL Server SQLEXPRESS is a local Windows service - not stopped)" -ForegroundColor DarkGray
  Write-Host ""
  exit 0
}

Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "    CapShop  -  Starting Infrastructure"      -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""

# ── SQL Server (local SQLEXPRESS) ─────────────────────────────────────────────
$sqlSvc = Get-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction SilentlyContinue
if ($sqlSvc) {
  if ($sqlSvc.Status -eq "Running") {
    Write-Ok "SQL Server (SQLEXPRESS) is running"
  }
  else {
    Write-Info "Starting SQLEXPRESS service..."
    Start-Service "MSSQL`$SQLEXPRESS" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    Write-Ok "SQLEXPRESS started"
  }
}
else {
  Write-Warn "MSSQL`$SQLEXPRESS service not found - check SQL Server installation"
}

# ── Helper: start via Docker ──────────────────────────────────────────────────
function Start-ViaDocker([string]$name, [string]$runArgs) {
  $running = docker ps --filter "name=$name" --format "{{.Names}}" 2>$null
  if ($running -eq $name) {
    Write-Ok "$name already running (Docker)"
    return $true
  }
  # Remove stopped container with same name if it exists
  docker rm $name 2>$null | Out-Null
  Invoke-Expression "docker run -d --name $name $runArgs" | Out-Null
  return ($LASTEXITCODE -eq 0)
}

# ── Helper: ensure Windows service is running ─────────────────────────────────
function Start-WinService([string]$svcName) {
  $svc = Get-Service $svcName -ErrorAction SilentlyContinue
  if (-not $svc) { return $false }
  if ($svc.Status -ne "Running") {
    Start-Service $svcName -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  }
  $svc = Get-Service $svcName -ErrorAction SilentlyContinue
  return ($svc.Status -eq "Running")
}

# ── Redis ─────────────────────────────────────────────────────────────────────
Write-Info "Setting up Redis..."

$redisReady = $false

# 1. Try existing Windows service
if (Start-WinService "Redis") {
  Write-Ok "Redis Windows service is running on :6379"
  $redisReady = $true
}

# 2. Try Docker
if (-not $redisReady -and $hasDocker) {
  if (Start-ViaDocker "capshop-redis" "-p 6379:6379 redis:7-alpine") {
    Write-Ok "Redis started via Docker on :6379"
    $redisReady = $true
  }
}

# 3. Try winget install (one-time)
if (-not $redisReady) {
  Write-Warn "Redis not found. Installing via winget (one-time, requires admin)..."
  winget install --id Redis.Redis -e --silent --accept-package-agreements --accept-source-agreements 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    # Refresh PATH and try starting
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    Start-Sleep -Seconds 2
    if (Start-WinService "Redis") {
      Write-Ok "Redis installed and started on :6379"
      $redisReady = $true
    }
    else {
      # Try running redis-server directly in background
      $redisExe = Get-Command redis-server -ErrorAction SilentlyContinue
      if ($redisExe) {
        Start-Process -FilePath $redisExe.Source -WindowStyle Minimized
        Start-Sleep -Seconds 2
        Write-Ok "Redis started (standalone) on :6379"
        $redisReady = $true
      }
    }
  }
}

if (-not $redisReady) {
  Write-Warn "Could not start Redis. Services will run without caching."
  Write-Host "  Install manually: https://github.com/microsoftarchive/redis/releases" -ForegroundColor DarkGray
}

# ── RabbitMQ ──────────────────────────────────────────────────────────────────
Write-Info "Setting up RabbitMQ..."

$rabbitReady = $false

# 1. Try existing Windows service
if (Start-WinService "RabbitMQ") {
  Write-Ok "RabbitMQ Windows service is running on :5672"
  $rabbitReady = $true
}

# 2. Try Docker
if (-not $rabbitReady -and $hasDocker) {
  if (Start-ViaDocker "capshop-rabbitmq" "-p 5672:5672 -p 15672:15672 rabbitmq:3-management") {
    Write-Ok "RabbitMQ started via Docker on :5672"
    $rabbitReady = $true
  }
}

# 3. Try winget install (one-time, needs Erlang first)
if (-not $rabbitReady) {
  Write-Warn "RabbitMQ not found. Installing via winget (one-time, requires admin)..."
  Write-Info "Installing Erlang (RabbitMQ dependency)..."
  winget install --id ErlangSolutions.Erlang -e --silent --accept-package-agreements --accept-source-agreements 2>&1 | Out-Null
  Write-Info "Installing RabbitMQ..."
  winget install --id RabbitMQ.RabbitMQ -e --silent --accept-package-agreements --accept-source-agreements 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    Start-Sleep -Seconds 5
    if (Start-WinService "RabbitMQ") {
      Write-Ok "RabbitMQ installed and started on :5672"
      $rabbitReady = $true
    }
  }
}

if (-not $rabbitReady) {
  Write-Warn "Could not start RabbitMQ. Async messaging (saga, notifications) will be disabled."
  Write-Host "  Install manually: https://www.rabbitmq.com/install-windows.html" -ForegroundColor DarkGray
}

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "    Infrastructure ready!" -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  SQL Server  ->  .\SQLEXPRESS  (Windows auth)" -ForegroundColor White
Write-Host "  Redis       ->  localhost:6379  $(if ($redisReady) { '[UP]' } else { '[DOWN]' })" -ForegroundColor $(if ($redisReady) { "Green" } else { "Yellow" })
Write-Host "  RabbitMQ    ->  localhost:5672  $(if ($rabbitReady) { '[UP]' } else { '[DOWN]' })" -ForegroundColor $(if ($rabbitReady) { "Green" } else { "Yellow" })
if ($rabbitReady) {
  Write-Host "  RabbitMQ UI ->  http://localhost:15672  (guest / guest)" -ForegroundColor DarkGray
}
Write-Host ""
Write-Host "  Now run:  .\dev-start.ps1" -ForegroundColor Green
Write-Host ""
