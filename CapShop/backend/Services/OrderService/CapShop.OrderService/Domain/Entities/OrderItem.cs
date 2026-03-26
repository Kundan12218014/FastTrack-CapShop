namespace CapShop.OrderService.Domain.Entities;

/// <summary>
/// Snapshot of a cart item at the time the order was placed.
/// ProductName and UnitPrice are copied from the cart — they never
/// change even if the catalog is updated later.
/// </summary>
public class OrderItem
{
    public Guid Id { get; private set; }
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; } = string.Empty;
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }

    public decimal LineTotal => UnitPrice * Quantity;

    private OrderItem() { }

    public static OrderItem Create(
        Guid orderId,
        Guid productId,
        string productName,
        int quantity,
        decimal unitPrice) => new()
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            ProductId = productId,
            ProductName = productName,
            Quantity = quantity,
            UnitPrice = unitPrice
        };
}