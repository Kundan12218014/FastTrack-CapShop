# ─────────────────────────────────────────────────────────────────────────────
# CapShop — Load .env to Terraform Environment Variables
#
# Use this script to load secrets from your root .env file into your
# PowerShell session so Terraform can "fetch" them automatically.
#
# Usage:
#   . .\load-env.ps1
# ─────────────────────────────────────────────────────────────────────────────

# Find the .env file in current or parent directory
$envPath = ""
if (Test-Path ".env") { $envPath = Resolve-Path ".env" }
elseif (Test-Path "..\.env") { $envPath = Resolve-Path "..\.env" }

if ($envPath) {
    Write-Host "[INFO] Loading environment variables from: $envPath" -ForegroundColor Cyan
    Get-Content $envPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and !$line.StartsWith("#") -and $line.Contains("=")) {
            $name, $value = $line.Split("=", 2)
            
            # Map .env keys to TF_VAR_ syntax
            switch ($name.Trim()) {
                "SQL_SA_PASSWORD" { $env:TF_VAR_sql_sa_password = $value.Trim() }
                "AUTH_SMTP_EMAIL" { $env:TF_VAR_smtp_email = $value.Trim() }
                "AUTH_SMTP_PASSWORD" { $env:TF_VAR_smtp_password = $value.Trim() }
                "AUTH_SMTP_HOST" { $env:TF_VAR_smtp_host = $value.Trim() }
                "AUTH_SMTP_PORT" { $env:TF_VAR_smtp_port = $value.Trim() }
            }
        }
    }
    Write-Host "[SUCCESS] Variables loaded! Terraform is now ready." -ForegroundColor Green
} else {
    Write-Host "[ERROR] .env file not found in the current or parent directory." -ForegroundColor Red
}
