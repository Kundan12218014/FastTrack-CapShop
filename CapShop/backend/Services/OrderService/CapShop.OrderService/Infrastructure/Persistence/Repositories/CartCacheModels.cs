using CapShop.OrderService.Domain.Entities;

namespace CapShop.OrderService.Infrastructure.Persistence.Repositories;

/// <summary>
/// Serialization-friendly models for storing Cart data in Redis.
/// The domain Cart entity uses private constructors/setters that System.Text.Json
/// cannot handle, so we map to/from these flat cache models instead.
/// </summary>
public class CartCacheModel
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Status { get; set; } = CartStatus.Active;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<CartItemCacheModel> Items { get; set; } = [];

    public static CartCacheModel FromDomain(Cart cart) => new()
    {
        Id = cart.Id,
        UserId = cart.UserId,
        Status = cart.Status,
        CreatedAt = cart.CreatedAt,
        UpdatedAt = cart.UpdatedAt,
        Items = cart.Items.Select(CartItemCacheModel.FromDomain).ToList()
    };

    /// <summary>
    /// Reconstructs a domain Cart from the cache model by replaying items.
    /// The Cart domain constructor cannot be called directly (private), so we
    /// use the factory + AddItem approach, but we restore state via reflection
    /// to preserve snapshotted prices without re-validating stock.
    /// </summary>
    public Cart ToDomain()
    {
        // Rebuild domain Cart via its public factory, then reflect-set private state
        var cart = CartFactory.Create(Id, UserId, Status, CreatedAt, UpdatedAt);
        foreach (var item in Items)
            CartFactory.AddItemDirect(cart, item.ToDomain());
        return cart;
    }
}

public class CartItemCacheModel
{
    public Guid Id { get; set; }
    public Guid CartId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public DateTime AddedAt { get; set; }

    public static CartItemCacheModel FromDomain(CartItem item) => new()
    {
        Id = item.Id,
        CartId = item.CartId,
        ProductId = item.ProductId,
        ProductName = item.ProductName,
        UnitPrice = item.UnitPrice,
        Quantity = item.Quantity,
        AddedAt = item.AddedAt
    };

    public CartItem ToDomain() =>
        CartItemFactory.Create(Id, CartId, ProductId, ProductName, UnitPrice, Quantity, AddedAt);
}
