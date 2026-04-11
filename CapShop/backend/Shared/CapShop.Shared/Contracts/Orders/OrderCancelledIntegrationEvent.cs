namespace CapShop.Shared.Contracts.Orders;

public record OrderCancelledIntegrationEvent(
    Guid OrderId,
    string OrderNumber,
    Guid UserId,
    List<OrderCancelledItem> Items,
    DateTime CancelledAtUtc);

public record OrderCancelledItem(
    Guid ProductId,
    int Quantity);
