using CapShop.OrderService.Domain.Enums;
using CapShop.OrderService.Domain.ValueObjects;
using CapShop.Shared.Exceptions;

namespace CapShop.OrderService.Domain.Entities;

/// <summary>
/// Order entity — the most important entity in the Order Service.
///
/// Key design decisions:
///  1. Status transitions are enforced HERE on the entity — not in controllers
///     or command handlers. This is domain logic — the entity owns it.
///  2. OrderItems snapshot product name + price at placement time.
///     If the catalog changes, historical orders are unaffected.
///  3. ShippingAddress is an owned entity (value object) — stored in
///     the same Orders table, not a separate table.
///  4. StatusHistory tracks every status change with who changed it and when.
/// </summary>
public class Order
{
    public Guid Id { get; private set; }
    public string OrderNumber { get; private set; } = string.Empty;
    public Guid UserId { get; private set; }
    public string CustomerEmail { get; private set; } = string.Empty;
    public decimal TotalAmount { get; private set; }
    public OrderStatus Status { get; private set; }
    public ShippingAddress ShippingAddress { get; private set; } = null!;
    public string PaymentMethod { get; private set; } = string.Empty;
    public string? PaymentTransactionId { get; private set; }
    public DateTime PlacedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation properties
    private readonly List<OrderItem> _items = [];
    private readonly List<OrderStatusHistory> _history = [];

    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();
    public IReadOnlyCollection<OrderStatusHistory> History => _history.AsReadOnly();

    private Order() { }

    // ── Factory ───────────────────────────────────────────────────────────
    public static Order Create(
        Guid userId,
        string customerEmail,
        ShippingAddress shippingAddress,
        string paymentMethod,
        List<CartItem> cartItems)
    {
        if (cartItems == null || cartItems.Count == 0)
            throw new DomainException("Cannot place an order with an empty cart.");

        if (string.IsNullOrWhiteSpace(customerEmail))
            throw new DomainException("Customer email is required to place an order.");

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = GenerateOrderNumber(),
            UserId = userId,
            CustomerEmail = customerEmail.Trim(),
            Status = OrderStatus.PaymentPending,
            ShippingAddress = shippingAddress,
            PaymentMethod = paymentMethod,
            PlacedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Snapshot cart items as order items
        foreach (var cartItem in cartItems)
        {
            var orderItem = OrderItem.Create(
                order.Id,
                cartItem.ProductId,
                cartItem.ProductName,
                cartItem.Quantity,
                cartItem.UnitPrice);
            order._items.Add(orderItem);
        }

        order.TotalAmount = order._items.Sum(i => i.LineTotal);

        // Record the initial status in history
        order._history.Add(OrderStatusHistory.Create(
            order.Id, null, OrderStatus.PaymentPending, "System", "Order placed and pending payment."));

        return order;
    }

    // ── Status transition — all business rules enforced here ──────────────
    public void UpdateStatus(OrderStatus newStatus, string changedBy, string? remarks = null)
    {
        // Define valid transitions — what can follow what
        var allowed = Status switch
        {
            OrderStatus.Draft => new[] { OrderStatus.CheckoutStarted, OrderStatus.Cancelled },
            OrderStatus.CheckoutStarted => new[] { OrderStatus.PaymentPending, OrderStatus.Cancelled },
            OrderStatus.PaymentPending => new[] { OrderStatus.Paid, OrderStatus.PaymentFailed, OrderStatus.Cancelled },
            OrderStatus.Paid => new[] { OrderStatus.Packed, OrderStatus.Cancelled },
            OrderStatus.Packed => new[] { OrderStatus.Shipped, OrderStatus.Cancelled },
            OrderStatus.Shipped => new[] { OrderStatus.Delivered },
            // Terminal states — no further transitions allowed
            OrderStatus.Delivered => Array.Empty<OrderStatus>(),
            OrderStatus.Cancelled => Array.Empty<OrderStatus>(),
            OrderStatus.PaymentFailed => new[] { OrderStatus.PaymentPending },
            _ => Array.Empty<OrderStatus>()
        };

        if (!allowed.Contains(newStatus))
            throw new DomainException(
                $"Cannot transition order from '{Status}' to '{newStatus}'. " +
                $"Allowed: {string.Join(", ", allowed.Select(s => s.ToString()))}.");

        var previous = Status;
        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;

        _history.Add(OrderStatusHistory.Create(
            Id, previous, newStatus, changedBy, remarks));
    }

    public void SetPaymentTransaction(string transactionId)
    {
        PaymentTransactionId = transactionId;
        UpdatedAt = DateTime.UtcNow;
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private static string GenerateOrderNumber()
    {
        // Format: CS-20240115-XXXX (CS = CapShop, date, 4 random chars)
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        var randomPart = Guid.NewGuid().ToString("N")[..6].ToUpper();
        return $"CS-{datePart}-{randomPart}";
    }
}