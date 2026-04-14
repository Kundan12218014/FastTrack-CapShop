#cloud-config
# CapShop VM Bootstrap Script
# Runs ONCE on first boot. Installs Docker, clones repo, writes secrets, starts services.
# Progress is logged to: /var/log/cloud-init-output.log
# Monitor with: sudo tail -f /var/log/cloud-init-output.log

package_update: true
package_upgrade: false

packages:
  - apt-transport-https
  - ca-certificates
  - curl
  - gnupg
  - git
  - htop
  - ncdu

runcmd:
  # ── 0. Set up Swap File (Essential for B2s / 4GB RAM machines) ───────────
  - echo "=== Setting up 4GB Swap Space ==="
  - fallocate -l 4G /swapfile
  - chmod 600 /swapfile
  - mkswap /swapfile
  - swapon /swapfile
  - echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

  # ── 1. Install Docker Engine ─────────────────────────────────────────────
  - echo "=== Installing Docker ==="
  - curl -fsSL https://get.docker.com | sh
  - systemctl enable docker
  - systemctl start docker
  - usermod -aG docker ${admin_username}

  # ── 2. Install Docker Compose v2 plugin ──────────────────────────────────
  - apt-get install -y docker-compose-plugin

  # ── 3. Clone Repository ──────────────────────────────────────────────────
  - echo "=== Cloning CapShop repository ==="
  - git clone ${github_repo_url} /opt/capshop
  - chown -R ${admin_username}:${admin_username} /opt/capshop

  # ── 4. Write .env file with secrets ──────────────────────────────────────
  # Note: Subdirectory CapShop is used because of repo structure
  - echo "=== Writing environment variables ==="
  - |
    cat > /opt/capshop/CapShop/.env << 'CAPSHOP_ENV'
    SQL_SA_PASSWORD=${sql_sa_password}
    AUTH_SMTP_EMAIL=${smtp_email}
    AUTH_SMTP_PASSWORD=${smtp_password}
    AUTH_SMTP_HOST=${smtp_host}
    AUTH_SMTP_PORT=${smtp_port}
    NOTIFICATION_SMTP_EMAIL=${smtp_email}
    NOTIFICATION_SMTP_PASSWORD=${smtp_password}
    NOTIFICATION_SMTP_HOST=${smtp_host}
    NOTIFICATION_SMTP_PORT=${smtp_port}
    CAPSHOP_ENV

  # ── 5. Install redeployment scripts ──────────────────────────────────────
  - cp /opt/capshop/CapShop/terraform/scripts/redeploy.sh /opt/redeploy.sh
  - chmod +x /opt/redeploy.sh
  - chown ${admin_username}:${admin_username} /opt/redeploy.sh

  # ── 6. Start all services (first run builds images — takes 5-10 min) ─────
  - echo "=== Starting CapShop services (this takes 5-10 minutes) ==="
  - cd /opt/capshop/CapShop && docker compose up -d --build

  # ── 7. Wait and verify ───────────────────────────────────────────────────
  - echo "=== Waiting 90s for services to initialise ==="
  - sleep 90
  - echo "=== Service status ==="
  - docker compose -f /opt/capshop/CapShop/docker-compose.yml ps
  - echo "=== CapShop is ready! ==="

# Write a startup service so Docker Compose restarts on VM reboot
write_files:
  - path: /etc/systemd/system/capshop.service
    content: |
      [Unit]
      Description=CapShop Docker Compose Services
      Requires=docker.service
      After=docker.service network-online.target

      [Service]
      Type=oneshot
      RemainAfterExit=yes
      WorkingDirectory=/opt/capshop/CapShop
      ExecStart=/usr/bin/docker compose up -d
      ExecStop=/usr/bin/docker compose down
      TimeoutStartSec=300
      User=${admin_username}

      [Install]
      WantedBy=multi-user.target
    permissions: '0644'

  # convenience alias: 'capshop-logs' shows all service logs
  - path: /etc/profile.d/capshop.sh
    content: |
      alias capshop-logs='docker compose -f /opt/capshop/CapShop/docker-compose.yml logs -f'
      alias capshop-status='docker compose -f /opt/capshop/CapShop/docker-compose.yml ps'
      alias capshop-restart='cd /opt/capshop/CapShop && docker compose restart'
      alias capshop-redeploy='/opt/redeploy.sh'
    permissions: '0644'

# Enable the systemd service so Docker Compose auto-starts on reboot
runcmd:
  - systemctl daemon-reload
  - systemctl enable capshop.service
