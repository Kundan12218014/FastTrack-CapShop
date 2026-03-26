using CapShop.Shared.Exceptions;

namespace CapShop.OrderService.Domain.Entities;

/// <summary>
/// Shopping cart entity.
/// A cart belongs to one user and contains CartItems.
/// Status transitions: Active → Converted (when order is placed) | Abandoned.
///
/// Business rules enforced here:
///  - Cannot add duplicate product (update qty instead)
///  - Cannot set qty beyond available stock
///  - Cart is Converted once PlaceOrder runs — cannot be reused
/// </summary>
public class Cart
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Status { get; private set; } = CartStatus.Active;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation property
    private readonly List<CartItem> _items = [];
    public IReadOnlyCollection<CartItem> Items => _items.AsReadOnly();

    // Computed total
    public decimal Total => _items.Sum(i => i.UnitPrice * i.Quantity);

    private Cart() { }

    public static Cart Create(Guid userId) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Status = CartStatus.Active,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    public CartItem AddItem(Guid productId, string productName,
                            decimal unitPrice, int quantity, int availableStock)
    {
        if (Status != CartStatus.Active)
            throw new DomainException("Cannot modify a cart that is no longer active.");

        if (quantity <= 0)
            throw new DomainException("Quantity must be at least 1.");

        if (quantity > availableStock)
            throw new DomainException(
                $"Only {availableStock} unit(s) available in stock.");

        // If product already in cart, update quantity instead of adding duplicate
        var existing = _items.FirstOrDefault(i => i.ProductId == productId);
        if (existing != null)
        {
            var newQty = existing.Quantity + quantity;
            if (newQty > availableStock)
                throw new DomainException(
                    $"Cannot add {quantity} more. Only {availableStock} units available.");

            existing.UpdateQuantity(newQty);
            UpdatedAt = DateTime.UtcNow;
            return existing;
        }

        var item = CartItem.Create(Id, productId, productName, unitPrice, quantity);
        _items.Add(item);
        UpdatedAt = DateTime.UtcNow;
        return item;
    }

    public void UpdateItemQuantity(Guid cartItemId, int newQuantity, int availableStock)
    {
        if (Status != CartStatus.Active)
            throw new DomainException("Cannot modify a cart that is no longer active.");

        var item = _items.FirstOrDefault(i => i.Id == cartItemId)
            ?? throw new NotFoundException("Cart item", cartItemId);

        if (newQuantity <= 0)
            throw new DomainException("Quantity must be at least 1.");

        if (newQuantity > availableStock)
            throw new DomainException(
                $"Only {availableStock} unit(s) available in stock.");

        item.UpdateQuantity(newQuantity);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveItem(Guid cartItemId)
    {
        var item = _items.FirstOrDefault(i => i.Id == cartItemId)
            ?? throw new NotFoundException("Cart item", cartItemId);

        _items.Remove(item);
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkAsConverted()
    {
        Status = CartStatus.Converted;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkAsAbandoned()
    {
        Status = CartStatus.Abandoned;
        UpdatedAt = DateTime.UtcNow;
    }
}

public static class CartStatus
{
    public const string Active = "Active";
    public const string Converted = "Converted";
    public const string Abandoned = "Abandoned";
}