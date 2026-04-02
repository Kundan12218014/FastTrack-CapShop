# ============================================================
#  CapShop -- Stop Script
#  Usage:  .\stop.ps1
# ============================================================

$Root     = $PSScriptRoot
$PidFile  = Join-Path $Root ".capshop-pids"

if (-not (Test-Path $PidFile)) {
    Write-Host ""
    Write-Host "  CapShop does not appear to be running (no .capshop-pids found)." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

Clear-Host
Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Red
Write-Host "    CapShop  --  Stopping All Services" -ForegroundColor Red
Write-Host "  ==========================================" -ForegroundColor Red
Write-Host ""

$Pids = Get-Content $PidFile

foreach ($Pid in $Pids) {
    if ($Pid -match '^\d+$') {
        try {
            $proc = Get-Process -Id $Pid -ErrorAction SilentlyContinue
            if ($proc) {
                $Name = $proc.ProcessName
                Write-Host "  [SHUTDOWN]  Stopping PID $Pid ($Name)..." -ForegroundColor Gray
                Stop-Process -Id $Pid -Force
            }
        } catch {
            # Process might already be gone
        }
    }
}

# Clean up
if (Test-Path $PidFile) {
    Remove-Item $PidFile -Force
}

Write-Host ""
Write-Host "  [OK]  All processes terminated." -ForegroundColor Green
Write-Host "  ==========================================" -ForegroundColor Red
Write-Host ""
