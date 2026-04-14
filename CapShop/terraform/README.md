# CapShop — Azure VM Deployment Guide
> **One VM. All services. No complexity. ~$35/month.**

Everything runs on a single Azure VM using your existing `docker-compose.yml`.  
No Container Apps. No Container Registry. No Key Vault. Just Docker.

---

## What Gets Created

```
Azure Resource Group: capshop-dev-rg
    ├── Virtual Network + Subnet
    ├── Network Security Group (ports 22, 80, 5000, 8080)
    ├── Public IP (static)
    └── Linux VM (Ubuntu 22.04, Standard_B2s — 2 CPU / 4 GB RAM)
            └── 4GB Swap Space (allows running high-RAM apps like SQL Server)
            └── Docker Compose runs all services:
                    ├── SQL Server 2022
                    ├── Redis
                    ├── RabbitMQ
                    ├── Auth Service
                    ├── Catalog Service
                    ├── Order Service
                    ├── Admin Service
                    ├── Notification Svc
                    ├── Gateway (Ocelot)   →  :5000 (public)
                    └── Frontend (nginx)   →  :8080 (public)
```

**Monthly cost: ~$35/month** (Standard_B2s)

| Component | Cost |
|---|---|
| VM (Standard_B2s) | ~$30.00 / month |
| OS Disk (64GB Premium) | ~$5.00 / month |
| **Total** | **~$35.00 / month** |

> 💡 This is the absolute cheapest "production-like" setup. 
> To save even more, stop the VM when not in use.

---

## Prerequisites — Install Once

```powershell
# Azure CLI
winget install Microsoft.AzureCLI

# Terraform
winget install HashiCorp.Terraform

# Verify
az --version       # should show 2.x+
terraform --version  # should show 1.7+
```

---

## Step 1 — Login to Azure

```powershell
az login                                        # Opens browser to sign in
az account list --output table                  # List your subscriptions
az account set --subscription "YOUR-SUB-ID"    # Select the right one
```

---

## Step 2 — Fill in Your Variables

```powershell
cd terraform
Copy-Item terraform.tfvars.example terraform.tfvars
notepad terraform.tfvars      # Edit with your values
```

Required values to set:
| Variable | Example | Notes |
|---|---|---|
| `location` | `East US` | Cheapest: East US, Southeast Asia |
| `github_repo_url` | `https://github.com/You/CapShop` | Or use `https://TOKEN@github.com/...` for private |
| `sql_sa_password` | `MyStr0ng_Pass!` | Min 8 chars with upper + lower + digit + symbol |
| `smtp_email` | `you@gmail.com` | Gmail address |
| `smtp_password` | `abcd efgh ijkl mnop` | Gmail App Password |

---

## Step 3 — Deploy Infrastructure (One Command)

```powershell
cd terraform

terraform init        # Download the Azure provider
terraform plan        # Preview what will be created
terraform apply       # Creates VM + all networking (~5 minutes)
```

After `apply` finishes you'll see:
```
vm_public_ip     = "20.185.xxx.xxx"
ssh_command      = "ssh -i terraform/capshop_vm.pem capshop@20.185.xxx.xxx"
frontend_url     = "http://20.185.xxx.xxx:8080"
gateway_url      = "http://20.185.xxx.xxx:5000"
```

> ⚠️ **The VM then runs cloud-init on first boot.** Services start automatically  
> but it takes **5-10 minutes** to download Docker images + build services.

---

## Step 4 — Verify It's Running

```powershell
# Check the gateway health endpoint
curl http://YOUR_VM_IP:5000/gateway/admin/health

# SSH in and check container status
ssh -i terraform/capshop_vm.pem capshop@YOUR_VM_IP
capshop-status    # alias set by cloud-init — shows all containers
capshop-logs      # tail all service logs
```

---

## Step 5 — Set Up GitHub Actions CI/CD

In your GitHub repo: **Settings → Secrets → Actions**

| Secret Name | Where to get it |
|---|---|
| `VM_IP` | From `terraform output vm_public_ip` |
| `VM_USERNAME` | The `admin_username` variable (default: `capshop`) |
| `VM_SSH_PRIVATE_KEY` | Copy/paste contents of `terraform/capshop_vm.pem` |

---

## Cost Control

```powershell
# Stop the VM when not in use (saves money while stopped):
az vm deallocate --name capshop-dev-vm --resource-group capshop-dev-rg

# Destroy everything:
terraform destroy
```
