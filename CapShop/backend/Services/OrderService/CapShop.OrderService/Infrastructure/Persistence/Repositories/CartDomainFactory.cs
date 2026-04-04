using System.Reflection;
using CapShop.OrderService.Domain.Entities;

namespace CapShop.OrderService.Infrastructure.Persistence.Repositories;

/// <summary>
/// Reflection-based factory that reconstructs Cart domain objects from Redis cache
/// without going through business logic validation (prices are already snapshotted).
/// </summary>
internal static class CartFactory
{
    private static readonly ConstructorInfo _ctor =
        typeof(Cart).GetConstructor(
            BindingFlags.NonPublic | BindingFlags.Instance,
            Type.EmptyTypes)!;

    private static readonly FieldInfo _itemsField =
        typeof(Cart).GetField("_items", BindingFlags.NonPublic | BindingFlags.Instance)!;

    public static Cart Create(Guid id, Guid userId, string status,
        DateTime createdAt, DateTime updatedAt)
    {
        var cart = (Cart)_ctor.Invoke(null);

        SetProp(cart, nameof(Cart.Id), id);
        SetProp(cart, nameof(Cart.UserId), userId);
        SetProp(cart, nameof(Cart.Status), status);
        SetProp(cart, nameof(Cart.CreatedAt), createdAt);
        SetProp(cart, nameof(Cart.UpdatedAt), updatedAt);

        return cart;
    }

    public static void AddItemDirect(Cart cart, CartItem item)
    {
        var list = (List<CartItem>)_itemsField.GetValue(cart)!;
        list.Add(item);
    }

    private static void SetProp(object obj, string propName, object value)
    {
        var prop = obj.GetType()
            .GetProperty(propName, BindingFlags.Public | BindingFlags.Instance)!;
        prop.SetValue(obj, value);
    }
}

/// <summary>
/// Reflection-based factory for CartItem, bypassing the private constructor.
/// </summary>
internal static class CartItemFactory
{
    private static readonly ConstructorInfo _ctor =
        typeof(CartItem).GetConstructor(
            BindingFlags.NonPublic | BindingFlags.Instance,
            Type.EmptyTypes)!;

    public static CartItem Create(Guid id, Guid cartId, Guid productId,
        string productName, decimal unitPrice, int quantity, DateTime addedAt)
    {
        var item = (CartItem)_ctor.Invoke(null);

        SetProp(item, nameof(CartItem.Id), id);
        SetProp(item, nameof(CartItem.CartId), cartId);
        SetProp(item, nameof(CartItem.ProductId), productId);
        SetProp(item, nameof(CartItem.ProductName), productName);
        SetProp(item, nameof(CartItem.UnitPrice), unitPrice);
        SetProp(item, nameof(CartItem.Quantity), quantity);
        SetProp(item, nameof(CartItem.AddedAt), addedAt);

        return item;
    }

    private static void SetProp(object obj, string propName, object value)
    {
        var prop = obj.GetType()
            .GetProperty(propName, BindingFlags.Public | BindingFlags.Instance)!;
        prop.SetValue(obj, value);
    }
}
