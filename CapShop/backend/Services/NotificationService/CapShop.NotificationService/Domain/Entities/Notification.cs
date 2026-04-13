namespace CapShop.NotificationService.Domain.Entities;

public class Notification
{
  public Guid Id { get; set; } = Guid.NewGuid();
  public Guid UserId { get; set; }
  public string Title { get; set; } = string.Empty;
  public string Message { get; set; } = string.Empty;
  public bool IsRead { get; set; } = false;
  public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
  public string EmailStatus { get; set; } = "Pending";
  public string? EmailFailureReason { get; set; }
}