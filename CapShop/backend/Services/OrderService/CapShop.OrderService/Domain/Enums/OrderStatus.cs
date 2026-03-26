namespace CapShop.OrderService.Domain.Enums;

/// <summary>
/// All possible states of an order.
/// The transition rules are enforced by Order.UpdateStatus() —
/// invalid transitions throw DomainException caught by GlobalExceptionMiddleware.
///
/// Lifecycle:
///   Draft → CheckoutStarted → PaymentPending → Paid → Packed → Shipped → Delivered
///   Any state before Packed → Cancelled (by customer)
///   Any state             → Cancelled (by admin override)
/// </summary>
public enum OrderStatus
{
    Draft = 0,
    CheckoutStarted = 1,
    PaymentPending = 2,
    Paid = 3,
    Packed = 4,
    Shipped = 5,
    Delivered = 6,
    Cancelled = 7,
    PaymentFailed = 8
}           