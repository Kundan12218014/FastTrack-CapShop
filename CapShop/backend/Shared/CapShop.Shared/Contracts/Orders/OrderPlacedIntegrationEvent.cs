namespace CapShop.Shared.Contracts.Orders;

public record OrderPlacedIntegrationEvent(
    Guid OrderId,
    string OrderNumber,
    Guid UserId,
    string CustomerEmail,
    decimal TotalAmount,
    string PaymentMethod,
    int ItemCount,
    DateTime PlacedAtUtc);
