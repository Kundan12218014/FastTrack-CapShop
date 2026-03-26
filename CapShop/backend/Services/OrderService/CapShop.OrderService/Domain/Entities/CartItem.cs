namespace CapShop.OrderService.Domain.Entities;

/// <summary>
/// Individual line item within a Cart.
/// UnitPrice is snapshotted at the time the item is added —
/// if the catalog price changes later, the cart price is unaffected.
/// </summary>
public class CartItem
{
    public Guid Id { get; private set; }
    public Guid CartId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; } = string.Empty;
    public decimal UnitPrice { get; private set; }  // snapshot at add time
    public int Quantity { get; private set; }
    public DateTime AddedAt { get; private set; }

    // Computed
    public decimal LineTotal => UnitPrice * Quantity;

    private CartItem() { }

    public static CartItem Create(
        Guid cartId,
        Guid productId,
        string productName,
        decimal unitPrice,
        int quantity) => new()
        {
            Id = Guid.NewGuid(),
            CartId = cartId,
            ProductId = productId,
            ProductName = productName,
            UnitPrice = unitPrice,
            Quantity = quantity,
            AddedAt = DateTime.UtcNow
        };

    public void UpdateQuantity(int newQuantity)
    {
        if (newQuantity <= 0)
            throw new ArgumentException("Quantity must be at least 1.", nameof(newQuantity));
        Quantity = newQuantity;
    }
}