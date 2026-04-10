namespace CapShop.Shared.Contracts.Orders;

public record OrderPlacedIntegrationEvent(
    Guid OrderId,
    string OrderNumber,
    Guid UserId,
    decimal TotalAmount,
    string PaymentMethod,
    int ItemCount,
    DateTime PlacedAtUtc);
