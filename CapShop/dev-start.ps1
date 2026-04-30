# =============================================================================
#  CapShop - Local Development Startup
#
#  Order of operations:
#    1.  Check infrastructure (SQLEXPRESS, Redis, RabbitMQ)
#    2.  Start Ollama (if not already running) + pull model
#    3.  Run EF Core migrations (all 5 databases)
#    4.  Start .NET microservices (Auth, Catalog, Order, Admin, Notification)
#    5.  Start API Gateway
#    6.  Run DataSeeder ONCE (skipped on subsequent runs via .seeded flag)
#    7.  Start AI Chatbot (FastAPI RAG service)
#    8.  Start Frontend (Vite dev server)
#
#  Usage:
#    .\dev-start.ps1                    # start everything
#    .\dev-start.ps1 -SkipSeeder        # skip the data seeder entirely
#    .\dev-start.ps1 -ForceReseed       # wipe .seeded flag and re-run seeder
#    .\dev-start.ps1 -SkipAI            # skip Ollama + RAG service
#    .\dev-start.ps1 -SkipFrontend      # skip Vite dev server
#
#  Stop everything:  .\dev-stop.ps1
# =============================================================================
param(
  [switch]$SkipSeeder,
  [switch]$ForceReseed,
  [switch]$SkipAI,
  [switch]$SkipFrontend
)

$ErrorActionPreference = "Continue"
$PidsFile = ".capshop-pids"
$SeededFlag = ".capshop-seeded"   # created after a successful seed run

# ?? Helpers ???????????????????????????????????????????????????????????????????
function Write-Header([string]$text) {
  Write-Host ""
  Write-Host "  -- $text" -ForegroundColor Cyan
  Write-Host "  $('-' * ($text.Length + 3))" -ForegroundColor DarkGray
}
function Write-Ok([string]$text) { Write-Host "  [OK]  $text" -ForegroundColor Green }
function Write-Warn([string]$text) { Write-Host "  [!!]  $text" -ForegroundColor Yellow }
function Write-Err([string]$text) { Write-Host "  [XX]  $text" -ForegroundColor Red }
function Write-Info([string]$text) { Write-Host "  [..]  $text" -ForegroundColor DarkGray }

function Start-BgService([string]$name, [string]$command, [string]$workDir) {
  Write-Info "Starting $name ..."
  $proc = Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoProfile", "-NoExit", "-Command", $command `
    -WorkingDirectory $workDir `
    -WindowStyle Normal `
    -PassThru
  Add-Content -Path $PidsFile -Value "$name=$($proc.Id)"
  Write-Ok "$name started  (PID $($proc.Id))"
  return $proc.Id
}

# Poll a TCP port until it responds or timeout
function Wait-ForPort([int]$port, [string]$label, [int]$timeoutSec = 90) {
  Write-Info "Waiting for $label on :$port ..."
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $tcp = New-Object System.Net.Sockets.TcpClient
      $tcp.Connect("127.0.0.1", $port)
      $tcp.Close()
      Write-Ok "$label ready on :$port"
      return $true
    }
    catch {
      Start-Sleep -Milliseconds 700
    }
  }
  Write-Warn "$label did not respond on :$port within ${timeoutSec}s - continuing anyway"
  return $false
}

# Poll an HTTP endpoint until it returns 2xx or timeout
function Wait-ForHttp([string]$url, [string]$label, [int]$timeoutSec = 120) {
  Write-Info "Waiting for $label at $url ..."
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
        Write-Ok "$label is ready (HTTP $($resp.StatusCode))"
        return $true
      }
    }
    catch { }
    Start-Sleep -Milliseconds 1000
  }
  Write-Warn "$label did not respond at $url within ${timeoutSec}s - continuing anyway"
  return $false
}

function Test-Port([int]$port) {
  try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", $port)
    $tcp.Close()
    return $true
  }
  catch { return $false }
}

# ?? Banner ????????????????????????????????????????????????????????????????????
Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "    CapShop  -  Local Dev Startup"            -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""

if (Test-Path $PidsFile) { Remove-Item $PidsFile -Force }

# ?? STEP 1 - Infrastructure ???????????????????????????????????????????????????
Write-Header "Step 1 - Infrastructure check"

$sqlSvc = Get-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction SilentlyContinue
if ($sqlSvc -and $sqlSvc.Status -eq "Running") {
  Write-Ok "SQL Server (SQLEXPRESS) is running"
}
elseif (Test-Port 1433) {
  Write-Ok "SQL Server reachable on :1433"
}
else {
  Write-Err "SQL Server is not running."
  Write-Host "  Start it:  net start MSSQL`$SQLEXPRESS  (run as Admin)" -ForegroundColor Yellow
  exit 1
}

if (Test-Port 6379) {
  Write-Ok "Redis is running on :6379"
}
else {
  Write-Warn "Redis not running - caching degraded. Run: .\dev-infra.ps1"
}

if (Test-Port 5672) {
  Write-Ok "RabbitMQ is running on :5672"
}
else {
  Write-Warn "RabbitMQ not running - async messaging disabled. Run: .\dev-infra.ps1"
}

# ?? STEP 2 - Ollama ???????????????????????????????????????????????????????????
if (-not $SkipAI) {
  Write-Header "Step 2 - Ollama (LLM runtime)"

  $ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
  $ollamaExe = if ($ollamaCmd) { $ollamaCmd.Source } else { $null }

  if (-not $ollamaExe) {
    Write-Warn "Ollama not found. Install from: https://ollama.com"
    $SkipAI = $true
  }
  else {
    if (Test-Port 11434) {
      Write-Ok "Ollama already running on :11434"
    }
    else {
      Write-Info "Starting Ollama server..."
      $ollamaProc = Start-Process -FilePath $ollamaExe -ArgumentList "serve" -WindowStyle Minimized -PassThru
      Add-Content -Path $PidsFile -Value "Ollama=$($ollamaProc.Id)"
      Wait-ForPort 11434 "Ollama" 20 | Out-Null
    }

    Write-Info "Checking for llama3.2:1b model..."
    $modelList = & $ollamaExe list 2>&1 | Out-String
    if ($modelList -match "llama3\.2:1b") {
      Write-Ok "llama3.2:1b model is available"
    }
    else {
      Write-Info "Pulling llama3.2:1b (~1.3 GB, one-time)..."
      & $ollamaExe pull llama3.2:1b
      if ($LASTEXITCODE -eq 0) { Write-Ok "Model pulled" } else { Write-Warn "Pull failed" }
    }
  }
}
else {
  Write-Header "Step 2 - Ollama"
  Write-Info "Skipping (-SkipAI)"
}

# ?? STEP 3 - EF Core migrations ???????????????????????????????????????????????
Write-Header "Step 3 - EF Core migrations"

$migrations = @(
  @{ Name = "AuthDB"; Dir = "backend/Services/AuthService/CapShop.AuthService" },
  @{ Name = "CatalogDB"; Dir = "backend/Services/CatalogService/CapShop.CatalogService" },
  @{ Name = "OrderDB"; Dir = "backend/Services/OrderService/CapShop.OrderService" },
  @{ Name = "AdminDB"; Dir = "backend/Services/AdminService/CapShop.AdminService" },
  @{ Name = "NotificationDB"; Dir = "backend/Services/NotificationService/CapShop.NotificationService" }
)

foreach ($m in $migrations) {
  Write-Info "Migrating $($m.Name) ..."
  $out = dotnet ef database update --project $m.Dir 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Ok "$($m.Name) up to date"
  }
  else {
    Write-Warn "$($m.Name) had warnings: $($out | Select-Object -Last 2 | Out-String)"
  }
}

# ?? STEP 4 - .NET microservices ???????????????????????????????????????????????
Write-Header "Step 4 - .NET microservices"

$services = @(
  @{ Name = "AuthService"; Dir = (Resolve-Path "backend/Services/AuthService/CapShop.AuthService").Path; Port = 5001 },
  @{ Name = "CatalogService"; Dir = (Resolve-Path "backend/Services/CatalogService/CapShop.CatalogService").Path; Port = 5002 },
  @{ Name = "OrderService"; Dir = (Resolve-Path "backend/Services/OrderService/CapShop.OrderService").Path; Port = 5003 },
  @{ Name = "AdminService"; Dir = (Resolve-Path "backend/Services/AdminService/CapShop.AdminService").Path; Port = 5004 },
  @{ Name = "NotificationService"; Dir = (Resolve-Path "backend/Services/NotificationService/CapShop.NotificationService").Path; Port = 7088 }
)

foreach ($svc in $services) {
  Start-BgService $svc.Name "dotnet run --launch-profile https" $svc.Dir | Out-Null
  Start-Sleep -Milliseconds 500
}

# ?? STEP 5 - API Gateway ??????????????????????????????????????????????????????
Write-Header "Step 5 - API Gateway"

$gatewayDir = (Resolve-Path "backend/Gateway/CapShop.Gateway").Path
Start-BgService "Gateway" "dotnet run --launch-profile https" $gatewayDir | Out-Null
Wait-ForPort 5000 "Gateway" 120 | Out-Null

# ?? STEP 6 - DataSeeder ???????????????????????????????????????????????????????
Write-Header "Step 6 - DataSeeder"

if ($SkipSeeder) {
  Write-Info "Skipping (-SkipSeeder flag set)"
}
elseif ((Test-Path $SeededFlag) -and (-not $ForceReseed)) {
  # Already seeded on a previous run - skip entirely
  $seededOn = Get-Content $SeededFlag -ErrorAction SilentlyContinue
  Write-Ok "Data already seeded on $seededOn - skipping"
  Write-Host "  To re-seed:  .\dev-start.ps1 -ForceReseed" -ForegroundColor DarkGray
}
else {
  if ($ForceReseed -and (Test-Path $SeededFlag)) {
    Remove-Item $SeededFlag -Force
    Write-Info "Force reseed requested - cleared .seeded flag"
  }

  # Wait for Auth and Catalog HTTP endpoints to be truly ready
  # (TCP open != migrations applied + app ready to serve)
  Write-Info "Waiting for Auth service to be HTTP-ready..."
  Wait-ForHttp "https://localhost:5001/swagger/v1/swagger.json" "AuthService" 120 | Out-Null

  Write-Info "Waiting for Catalog service to be HTTP-ready..."
  Wait-ForHttp "https://localhost:5002/swagger/v1/swagger.json" "CatalogService" 120 | Out-Null

  $seederDir = (Resolve-Path "CapShop.DataSeeder").Path
  Write-Info "Running DataSeeder..."

  $env:ASPNETCORE_ENVIRONMENT = "Development"
  Push-Location $seederDir
  $seederOutput = dotnet run 2>&1
  $seederExit = $LASTEXITCODE
  Pop-Location

  if ($seederExit -eq 0) {
    # Write the flag file so we never run the seeder again unless forced
    Set-Content -Path $SeededFlag -Value (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    Write-Ok "DataSeeder completed - data is ready"
    $seederOutput | Select-Object -Last 8 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
  }
  else {
    Write-Warn "DataSeeder exited with code $seederExit"
    $seederOutput | Select-Object -Last 8 | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
    Write-Host "  If data already exists this is normal. Use -ForceReseed to re-run." -ForegroundColor DarkGray
  }
}

# ?? STEP 7 - AI Chatbot ???????????????????????????????????????????????????????
if (-not $SkipAI) {
  Write-Header "Step 7 - AI Chatbot (FastAPI RAG)"

  $aiDir = (Resolve-Path "backend/Services/ollama_rag_app").Path
  $uvicorn = "$aiDir\.venv\Scripts\uvicorn.exe"

  if (Test-Path $uvicorn) {
    Start-BgService "AIService" "& '$uvicorn' fastapi_app:app --host 127.0.0.1 --port 8001 --reload" $aiDir | Out-Null
    Wait-ForPort 8001 "AI Service" 30 | Out-Null
  }
  else {
    Write-Warn "Python venv not found. Run .\dev-setup.ps1 first."
  }
}
else {
  Write-Header "Step 7 - AI Chatbot"
  Write-Info "Skipping (-SkipAI)"
}

# ?? STEP 8 - Frontend ?????????????????????????????????????????????????????????
if (-not $SkipFrontend) {
  Write-Header "Step 8 - Frontend (Vite)"

  $frontendDir = (Resolve-Path "frontend").Path
  Start-BgService "Frontend" "npm run dev" $frontendDir | Out-Null
  Wait-ForPort 5173 "Frontend" 120 | Out-Null
}
else {
  Write-Header "Step 8 - Frontend"
  Write-Info "Skipping (-SkipFrontend)"
}

# ?? Summary ???????????????????????????????????????????????????????????????????
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "    CapShop is running!" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend      ->  http://localhost:5173"                  -ForegroundColor White
Write-Host "  Gateway       ->  https://localhost:5000"                 -ForegroundColor Cyan
Write-Host "  Auth          ->  https://localhost:5001/swagger"         -ForegroundColor DarkGray
Write-Host "  Catalog       ->  https://localhost:5002/swagger"         -ForegroundColor DarkGray
Write-Host "  Orders        ->  https://localhost:5003/swagger"         -ForegroundColor DarkGray
Write-Host "  Admin         ->  https://localhost:5004/swagger"         -ForegroundColor DarkGray
Write-Host "  Notification  ->  https://localhost:7088/swagger"         -ForegroundColor DarkGray
Write-Host "  AI Chatbot    ->  http://localhost:8001/docs"             -ForegroundColor Magenta
Write-Host "  Ollama        ->  http://localhost:11434"                 -ForegroundColor Magenta
Write-Host "  RabbitMQ UI   ->  http://localhost:15672  (guest/guest)"  -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Login:  admin@capshop.com / Admin@1234" -ForegroundColor White
Write-Host "          priya.patel@gmail.com / Password1!" -ForegroundColor White
Write-Host ""
Write-Host "  Stop all:  .\dev-stop.ps1" -ForegroundColor Yellow
Write-Host ""
