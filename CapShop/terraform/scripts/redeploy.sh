#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# CapShop — Redeployment Script
# Runs on the Azure VM to pull latest code and restart all services.
#
# Usage:
#   Manual  : ssh into VM → /opt/redeploy.sh
#   CI/CD   : Called automatically by GitHub Actions on push to main
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# APP_DIR points to the subdirectory where docker-compose.yml lives
APP_DIR="/opt/capshop/CapShop"
LOG_FILE="/opt/capshop/redeploy.log"

# Ensure log file exists and is writable
touch "$LOG_FILE" || true

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "═══════════════════════════════════════════════"
log "  CapShop Redeployment Started"
log "═══════════════════════════════════════════════"

# ── 1. Pull latest code ────────────────────────────────────────────────────
log "📥  Pulling latest code from GitHub..."
cd "/opt/capshop"
git fetch origin main
git reset --hard origin/main
log "✅  Code updated to: $(git log -1 --pretty='%h %s')"

# ── 2. Stop running services gracefully ───────────────────────────────────
log "🛑  Stopping running services..."
cd "$APP_DIR"
docker compose down --remove-orphans || true

# ── 3. Build updated images ───────────────────────────────────────────────
log "🔨  Building Docker images (caching enabled)..."
docker compose build

# ── 4. Start services ─────────────────────────────────────────────────────
log "🚀  Starting all services..."
docker compose up -d

# ── 5. Wait for services to initialise ────────────────────────────────────
log "⏳  Waiting 60s for services to initialise..."
sleep 60

# ── 6. Health check ───────────────────────────────────────────────────────
log "🏥  Running health check..."
if curl --fail --silent --retry 5 --retry-delay 10 \
    "http://localhost:5000/gateway/admin/health" > /dev/null; then
  log "✅  Health check PASSED — gateway is responding"
else
  log "❌  Health check FAILED — check 'docker compose logs' for errors"
  docker compose ps
  exit 1
fi

# ── 7. Show running containers ────────────────────────────────────────────
log "📋  Running containers:"
docker compose ps

log "═══════════════════════════════════════════════"
log "  ✅ Redeployment Complete!"
log "  Frontend : http://\$(curl -s ifconfig.me):8080"
log "  Gateway  : http://\$(curl -s ifconfig.me):5000"
log "═══════════════════════════════════════════════"
