# ============================================================
#  CapShop -- Stop Script
#  Usage:  .\stop.ps1
# ============================================================

$Root    = $PSScriptRoot
$PidFile = Join-Path $Root ".capshop-pids"

Clear-Host
Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Red
Write-Host "    CapShop  --  Shutting Down" -ForegroundColor Red
Write-Host "  ==========================================" -ForegroundColor Red
Write-Host ""

$killed = 0
$missed = 0

# Helper function to forcefully terminate
function Kill-Proc($pname) {
    $procs = Get-WmiObject Win32_Process -Filter "Name='$pname'" -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
        $cmd = $p.CommandLine
        if ([string]::IsNullOrWhiteSpace($cmd) -or $cmd -like "*FastTrack-CapShop*") {
            $p.Terminate() | Out-Null
            Set-Variable -Name killed -Value ($killed + 1) -Scope Script
        }
    }
}

Write-Host "  Scanning and forcefully terminating CapShop processes..." -ForegroundColor Yellow

# Kill the actual service EXEs
Kill-Proc "CapShop.AuthService.exe"
Kill-Proc "CapShop.CatalogService.exe"
Kill-Proc "CapShop.OrderService.exe"
Kill-Proc "CapShop.AdminService.exe"
Kill-Proc "CapShop.Gateway.exe"

# Kill dotnets & nodes associated
Kill-Proc "dotnet.exe"
Kill-Proc "node.exe"

if (Test-Path $PidFile) {
    Remove-Item $PidFile -Force
}

# ── Port check ────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  Port status after shutdown:" -ForegroundColor Cyan

foreach ($port in @(5000, 5001, 5002, 5003, 5004, 5101, 5102, 5103, 5104, 5173)) {
    $conn = netstat -ano 2>$null | Select-String ":$port\s" | Select-Object -First 1
    if ($conn) {
        Write-Host "  [WARN]  Port $port  still in use : $($conn.ToString().Trim())" -ForegroundColor Yellow
        
        # Super-force WMI kill whoever is holding it
        $parts = $conn.ToString() -split '\s+'
        $pidHolder = $parts[-1]
        if ($pidHolder -match '^\d+$' -and $pidHolder -ne "0") {
             $w = Get-WmiObject Win32_Process -Filter "ProcessId='$pidHolder'" -ErrorAction SilentlyContinue
             if ($w) { $w.Terminate() | Out-Null }
        }
    } else {
        Write-Host "  [OK]    Port $port  is completely free" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Red
Write-Host "  Services successfully terminated." -ForegroundColor Green
Write-Host "  ==========================================" -ForegroundColor Red
Write-Host ""
