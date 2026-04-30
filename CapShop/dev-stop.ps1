# =============================================================================
#  CapShop - Local Development Stop
#  Kills all processes started by dev-start.ps1
#
#  Usage:  .\dev-stop.ps1
# =============================================================================

$PidsFile = ".capshop-pids"

Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Red
Write-Host "    CapShop  -  Stopping Local Dev"           -ForegroundColor Red
Write-Host "  ============================================" -ForegroundColor Red
Write-Host ""

if (-not (Test-Path $PidsFile)) {
  Write-Host "  No .capshop-pids file found - nothing to stop." -ForegroundColor Yellow
  exit 0
}

$lines = Get-Content $PidsFile
foreach ($line in $lines) {
  if ($line -match "^(.+)=(\d+)$") {
    $name = $Matches[1]
    $pid = [int]$Matches[2]
    try {
      $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
      if ($proc) {
        # Kill child processes first (dotnet, node, uvicorn, etc.)
        $children = Get-CimInstance Win32_Process |
        Where-Object { $_.ParentProcessId -eq $pid }
        foreach ($child in $children) {
          Stop-Process -Id $child.ProcessId -Force -ErrorAction SilentlyContinue
        }
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "  [OK]  Stopped $name (PID $pid)" -ForegroundColor Green
      }
      else {
        Write-Host "  [--]  $name (PID $pid) was already stopped" -ForegroundColor DarkGray
      }
    }
    catch {
      Write-Host "  [!!]  Could not stop $name (PID $pid): $_" -ForegroundColor Yellow
    }
  }
}

Remove-Item $PidsFile -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "  All local dev processes stopped." -ForegroundColor Green
Write-Host "  Infrastructure (Redis, RabbitMQ) is still running." -ForegroundColor DarkGray
Write-Host "  To stop infra:  .\dev-infra.ps1 -Stop" -ForegroundColor DarkGray
Write-Host ""
