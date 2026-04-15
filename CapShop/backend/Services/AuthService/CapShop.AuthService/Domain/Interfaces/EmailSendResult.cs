namespace CapShop.AuthService.Domain.Interfaces;

public record EmailSendResult(bool Success, string? ErrorMessage = null);
