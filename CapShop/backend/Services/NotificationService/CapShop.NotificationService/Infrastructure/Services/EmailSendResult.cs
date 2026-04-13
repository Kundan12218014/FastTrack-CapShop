namespace CapShop.NotificationService.Infrastructure.Services;

public record EmailSendResult(bool Success, string? ErrorMessage = null);
