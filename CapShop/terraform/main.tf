# ═══════════════════════════════════════════════════════════════════════════════
# CapShop — Single Azure VM Deployment
#
# Everything runs in Docker Compose on ONE virtual machine.
# No ACR, no Container Apps, no Key Vault — just a VM with Docker.
#
# What gets created:
#   ├── Resource Group
#   ├── SSH Key Pair (auto-generated, saved to capshop_vm.pem)
#   ├── Virtual Network + Subnet
#   ├── Network Security Group (SSH:22, HTTP:80, App:5000+8080)
#   ├── Public IP (static, with DNS label)
#   ├── Network Interface
#   └── Linux VM (Ubuntu 22.04)
#         └── cloud-init: installs Docker, clones repo, writes .env, starts services
# ═══════════════════════════════════════════════════════════════════════════════

locals {
  prefix = "${var.project_name}-${var.environment}"
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ─── Resource Group ───────────────────────────────────────────────────────────
resource "azurerm_resource_group" "rg" {
  name     = "${local.prefix}-rg"
  location = var.location
  tags     = local.tags
}

# ─── SSH Key Pair (auto-generated) ────────────────────────────────────────────
resource "tls_private_key" "ssh" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# saves to terraform/capshop_vm.pem (protected by .gitignore)
resource "local_file" "ssh_private_key" {
  content         = tls_private_key.ssh.private_key_pem
  filename        = "${path.module}/capshop_vm.pem"
  file_permission = "0600"
}

# ─── Virtual Network ──────────────────────────────────────────────────────────
resource "azurerm_virtual_network" "vnet" {
  name                = "${local.prefix}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  tags                = local.tags
}

resource "azurerm_subnet" "subnet" {
  name                 = "${local.prefix}-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

# ─── Network Security Group ───────────────────────────────────────────────────
resource "azurerm_network_security_group" "nsg" {
  name                = "${local.prefix}-nsg"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  tags                = local.tags

  # SSH — restricted to your IP for safety
  security_rule {
    name                       = "SSH"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = var.allowed_ssh_cidr
    destination_address_prefix = "*"
  }

  # HTTP — public web traffic
  security_rule {
    name                       = "HTTP"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # App ports: Gateway (5000) + Frontend (8080)
  security_rule {
    name                       = "App-Gateway"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5000"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "App-Frontend"
    priority                   = 130
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "8080"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# ─── Public IP (Static with DNS label) ────────────────────────────────────────
resource "azurerm_public_ip" "pip" {
  name                = "${local.prefix}-pip"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
  # Creates a FQDN: capshop-dev-vm.eastus.cloudapp.azure.com
  domain_name_label   = "${local.prefix}-vm"
  tags                = local.tags
}

# ─── Network Interface ────────────────────────────────────────────────────────
resource "azurerm_network_interface" "nic" {
  name                = "${local.prefix}-nic"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  tags                = local.tags

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.pip.id
  }
}

resource "azurerm_network_interface_security_group_association" "nic_nsg" {
  network_interface_id      = azurerm_network_interface.nic.id
  network_security_group_id = azurerm_network_security_group.nsg.id
}

# ─── Virtual Machine ──────────────────────────────────────────────────────────
resource "azurerm_linux_virtual_machine" "vm" {
  name                = "${local.prefix}-vm"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  size                = var.vm_size
  admin_username      = var.admin_username
  tags                = local.tags

  network_interface_ids = [azurerm_network_interface.nic.id]

  # Use the auto-generated SSH key (no password auth)
  disable_password_authentication = true
  admin_ssh_key {
    username   = var.admin_username
    public_key = tls_private_key.ssh.public_key_openssh
  }

  os_disk {
    name                 = "${local.prefix}-osdisk"
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = 64    # Room for Docker images + SQL Server data volumes
  }

  # Ubuntu 22.04 LTS (stable, well-supported, great Docker support)
  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  # cloud-init script runs on FIRST BOOT ONLY:
  # installs Docker, clones repo, writes .env, starts docker compose
  custom_data = base64encode(
    templatefile("${path.module}/scripts/cloud-init.yml.tpl", {
      admin_username  = var.admin_username
      github_repo_url = var.github_repo_url
      sql_sa_password = var.sql_sa_password
      smtp_email      = var.smtp_email
      smtp_password   = var.smtp_password
      smtp_host       = var.smtp_host
      smtp_port       = var.smtp_port
    })
  )
}
