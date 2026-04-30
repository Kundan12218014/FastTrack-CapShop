# =============================================================================
#  CapShop - One-time Local Development Setup
#  Run this ONCE after cloning the repo.
#
#  What it does:
#    1. Checks prerequisites (.NET 10, Node 18+, Python 3.10+, Docker)
#    2. Installs .NET dev certificates (HTTPS)
#    3. Restores all NuGet packages
#    4. Installs frontend npm packages
#    5. Creates Python venv for the AI service and installs requirements
#    6. Copies .env.example to .env (if .env does not exist)
#
#  Usage:  .\dev-setup.ps1
# =============================================================================

$ErrorActionPreference = "Continue"

function Write-Header([string]$text) {
  Write-Host ""
  Write-Host "  -- $text" -ForegroundColor Cyan
  Write-Host "  $('-' * ($text.Length + 3))" -ForegroundColor DarkGray
}
function Write-Ok([string]$text) { Write-Host "  [OK]  $text" -ForegroundColor Green }
function Write-Warn([string]$text) { Write-Host "  [!!]  $text" -ForegroundColor Yellow }
function Write-Err([string]$text) { Write-Host "  [XX]  $text" -ForegroundColor Red }
function Write-Info([string]$text) { Write-Host "  [..]  $text" -ForegroundColor DarkGray }

Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Magenta
Write-Host "    CapShop  -  Dev Environment Setup"        -ForegroundColor Magenta
Write-Host "  ============================================" -ForegroundColor Magenta
Write-Host ""

# ── 1. Prerequisites ──────────────────────────────────────────────────────────
Write-Header "Checking prerequisites"

# .NET
try {
  $dotnetVer = (dotnet --version 2>&1).ToString().Trim()
  if ($dotnetVer -match "^10\.") {
    Write-Ok ".NET $dotnetVer"
  }
  else {
    Write-Warn ".NET $dotnetVer found - .NET 10 is recommended. Download: https://dotnet.microsoft.com/download"
  }
}
catch {
  Write-Err ".NET SDK not found. Install from: https://dotnet.microsoft.com/download"
  exit 1
}

# Node.js
try {
  $nodeVer = (node --version 2>&1).ToString().Trim()
  Write-Ok "Node.js $nodeVer"
  if ($nodeVer -match "^v(\d+)\." -and [int]$Matches[1] -lt 18) {
    Write-Warn "Node 18+ is recommended"
  }
}
catch {
  Write-Err "Node.js not found. Install from: https://nodejs.org"
  exit 1
}

# Python
$pythonCmd = $null
foreach ($cmd in @("python", "python3", "py")) {
  try {
    $ver = (& $cmd --version 2>&1).ToString().Trim()
    if ($ver -match "Python 3\.(1[0-9]|[2-9]\d)") {
      $pythonCmd = $cmd
      Write-Ok "$ver  (command: $cmd)"
      break
    }
  }
  catch {}
}
if (-not $pythonCmd) {
  Write-Warn "Python 3.10+ not found. AI chatbot will not work. Install from: https://python.org"
}

# Docker
try {
  $dockerVer = (docker --version 2>&1).ToString().Trim()
  Write-Ok $dockerVer
}
catch {
  Write-Warn "Docker not found - needed for Redis and RabbitMQ (dev-infra.ps1)"
}

# EF Core tools
try {
  $efVer = (dotnet ef --version 2>&1).ToString().Trim()
  Write-Ok "EF Core tools $efVer"
}
catch {
  Write-Info "Installing EF Core tools globally..."
  dotnet tool install --global dotnet-ef
  Write-Ok "EF Core tools installed"
}

# ── 2. .env file ──────────────────────────────────────────────────────────────
Write-Header "Environment file"

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Ok ".env created from .env.example"
  Write-Warn "Edit .env and set your JWT secret and SMTP credentials before starting"
}
else {
  Write-Ok ".env already exists"
}

# ── 3. HTTPS dev certificate ──────────────────────────────────────────────────
Write-Header "HTTPS development certificate"

Write-Info "Trusting .NET dev certificate (you may see a UAC prompt)..."
dotnet dev-certs https --trust 2>&1 | Out-Null
Write-Ok "Dev certificate trusted"

# ── 4. NuGet restore ──────────────────────────────────────────────────────────
Write-Header "Restoring NuGet packages"

Write-Info "Restoring solution..."
dotnet restore "backend/CapShop.slnx" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Ok "NuGet packages restored"
}
else {
  Write-Warn "NuGet restore had warnings - check output above"
}

# ── 5. Frontend npm install ───────────────────────────────────────────────────
Write-Header "Installing frontend dependencies"

Write-Info "Running npm install in frontend/ ..."
Push-Location "frontend"
npm install 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Ok "npm packages installed"
}
else {
  Write-Warn "npm install had issues - try running it manually in the frontend/ folder"
}
Pop-Location

# ── 6. Python venv for AI service ────────────────────────────────────────────
Write-Header "Setting up Python AI service"

if ($pythonCmd) {
  $aiDir = "backend/Services/ollama_rag_app"
  $venvDir = "$aiDir\.venv"

  if (-not (Test-Path "$venvDir\Scripts\python.exe")) {
    Write-Info "Creating Python virtual environment..."
    & $pythonCmd -m venv $venvDir
    Write-Ok "Virtual environment created at $venvDir"
  }
  else {
    Write-Ok "Virtual environment already exists"
  }

  Write-Info "Installing Python requirements..."
  & "$venvDir\Scripts\pip.exe" install --upgrade pip -q
  & "$venvDir\Scripts\pip.exe" install -r "$aiDir\requirements.txt" -q
  if ($LASTEXITCODE -eq 0) {
    Write-Ok "Python requirements installed"
  }
  else {
    Write-Warn "Some Python packages failed to install - check manually"
  }

  # Check Ollama
  try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", 11434)
    $tcp.Close()
    Write-Ok "Ollama is already running on :11434"
  }
  catch {
    Write-Warn "Ollama is not running. Install from: https://ollama.com"
    Write-Host "  After installing, run in a separate terminal:" -ForegroundColor DarkGray
    Write-Host "    ollama serve" -ForegroundColor White
    Write-Host "    ollama pull llama3.2:1b" -ForegroundColor White
  }
}
else {
  Write-Warn "Skipping Python setup (Python 3.10+ not found)"
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "    Setup complete!" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "    1. Edit .env with your JWT secret and SMTP settings" -ForegroundColor Yellow
Write-Host "    2. Start infrastructure:  .\dev-infra.ps1" -ForegroundColor Cyan
Write-Host "    3. Start all services:    .\dev-start.ps1" -ForegroundColor Cyan
Write-Host "    4. Open browser:          http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "  For Docker instead:  .\startup.ps1" -ForegroundColor DarkGray
Write-Host ""
