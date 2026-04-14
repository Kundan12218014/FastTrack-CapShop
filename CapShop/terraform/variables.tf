# ─────────────────────────────────────────────────────────────────────────────
# GENERAL
# ─────────────────────────────────────────────────────────────────────────────
variable "location" {
  description = "Azure region (e.g. 'East US', 'Central India', 'West Europe')"
  type        = string
  default     = "centralindia"
}

variable "environment" {
  description = "Environment tag: dev | prod"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Short project prefix used in all resource names"
  type        = string
  default     = "capshop"
}

# ─────────────────────────────────────────────────────────────────────────────
# VIRTUAL MACHINE
# ─────────────────────────────────────────────────────────────────────────────
variable "vm_size" {
  description = <<EOF
Azure VM size. Recommended options:
  Standard_B2s  — 2 vCPU, 4 GB RAM (~$35/month) ← Cheapest capable (requires Swap)
  Standard_B2ms — 2 vCPU, 8 GB RAM (~$60/month) ← Recommended stable
EOF
  type        = string
  default     = "Standard_B2s"
}

variable "admin_username" {
  description = "Linux admin username for the VM"
  type        = string
  default     = "capshop"
}

variable "allowed_ssh_cidr" {
  description = "IP CIDR allowed to SSH into the VM. Use your IP for security, or '*' to allow all (not recommended for prod)."
  type        = string
  default     = "*"
}

# ─────────────────────────────────────────────────────────────────────────────
# GITHUB REPOSITORY
# ─────────────────────────────────────────────────────────────────────────────
variable "github_repo_url" {
  description = "GitHub repository HTTPS URL."
  type        = string
  default     = "https://github.com/Kundan12218014/FastTrack-CapShop"
}

# ─────────────────────────────────────────────────────────────────────────────
# APPLICATION SECRETS
# ─────────────────────────────────────────────────────────────────────────────
variable "sql_sa_password" {
  description = "SQL Server SA password (min 8 chars, upper + lower + digit + symbol)"
  type        = string
  sensitive   = true
}

variable "smtp_email" {
  description = "SMTP sender email address"
  type        = string
}

variable "smtp_password" {
  description = "SMTP password or Gmail App Password"
  type        = string
  sensitive   = true
}

variable "smtp_host" {
  description = "SMTP host"
  type        = string
  default     = "smtp.gmail.com"
}

variable "smtp_port" {
  description = "SMTP port"
  type        = string
  default     = "587"
}
