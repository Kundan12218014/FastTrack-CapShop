using CapShop.OrderService.Domain.Enums;

namespace CapShop.OrderService.Domain.Entities;

/// <summary>
/// Audit trail of every status change on an order.
/// Answers: who changed it, when, from what, to what, and why.
/// Never deleted — provides full order lifecycle visibility.
/// </summary>
public class OrderStatusHistory
{
    public Guid Id { get; private set; }
    public Guid OrderId { get; private set; }
    public OrderStatus? FromStatus { get; private set; }
    public OrderStatus ToStatus { get; private set; }
    public string ChangedBy { get; private set; } = string.Empty;
    public string? Remarks { get; private set; }
    public DateTime ChangedAt { get; private set; }

    private OrderStatusHistory() { }

    public static OrderStatusHistory Create(
        Guid orderId,
        OrderStatus? fromStatus,
        OrderStatus toStatus,
        string changedBy,
        string? remarks = null) => new()
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            ChangedBy = changedBy,
            Remarks = remarks,
            ChangedAt = DateTime.UtcNow
        };
}