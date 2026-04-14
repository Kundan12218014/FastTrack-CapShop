output "vm_public_ip" {
  description = "VM public IP address — add this to DNS or use directly"
  value       = azurerm_public_ip.pip.ip_address
}

output "vm_fqdn" {
  description = "VM fully-qualified domain name (Azure DNS)"
  value       = azurerm_public_ip.pip.fqdn
}

output "ssh_command" {
  description = "SSH command to connect to the VM"
  value       = "ssh -i terraform/capshop_vm.pem ${var.admin_username}@${azurerm_public_ip.pip.ip_address}"
}

output "frontend_url" {
  description = "React frontend URL"
  value       = "http://${azurerm_public_ip.pip.ip_address}:8080"
}

output "gateway_url" {
  description = "API Gateway URL"
  value       = "http://${azurerm_public_ip.pip.ip_address}:5000"
}

output "gateway_health_url" {
  description = "Health check endpoint"
  value       = "http://${azurerm_public_ip.pip.ip_address}:5000/gateway/admin/health"
}

output "ssh_private_key_path" {
  description = "Path to the generated SSH private key (keep this safe!)"
  value       = "${path.cwd}/terraform/capshop_vm.pem"
}

output "github_actions_secrets" {
  description = "Values needed for GitHub Actions secrets"
  value = {
    VM_IP         = azurerm_public_ip.pip.ip_address
    VM_USERNAME   = var.admin_username
    # VM_SSH_PRIVATE_KEY = copy contents of terraform/capshop_vm.pem
  }
}
