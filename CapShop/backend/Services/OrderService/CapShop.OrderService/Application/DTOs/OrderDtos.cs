using CapShop.OrderService.Domain.ValueObjects;

namespace CapShop.OrderService.Application.DTOs;

// ── REQUEST DTOs ──────────────────────────────────────────────────────────

public class AddToCartRequestDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public int AvailableStock { get; set; }
}

public class UpdateCartItemRequestDto
{
    public int Quantity { get; set; }
    public int AvailableStock { get; set; }
}

public class ShippingAddressDto
{
    public string FullName { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}

public class PlaceOrderRequestDto
{
    public ShippingAddressDto ShippingAddress { get; set; } = null!;
    public string PaymentMethod { get; set; } = string.Empty;
    public string TransactionId { get; set; } = string.Empty;
}

public class SimulatePaymentRequestDto
{
    public string PaymentMethod { get; set; } = string.Empty;
    // In a real app this would include card details, UPI ID etc.
    // For simulation, we just randomly succeed/fail based on method.
}

public class CancelOrderRequestDto
{
    public string Reason { get; set; } = string.Empty;
}

// ── RESPONSE DTOs ─────────────────────────────────────────────────────────

public class CartItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }
}

public class CartDto
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<CartItemDto> Items { get; set; } = [];
    public decimal Total { get; set; }
    public int ItemCount { get; set; }
}

public class OrderItemDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

public class OrderSummaryDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime PlacedAt { get; set; }
    public int ItemCount { get; set; }
}

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public DateTime PlacedAt { get; set; }
    public ShippingAddressDto ShippingAddress { get; set; } = null!;
    public List<OrderItemDto> Items { get; set; } = [];
}

public class PaymentSimulationResponseDto
{
    public bool IsSuccess { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public string? FailureReason { get; set; }
    public string Message { get; set; } = string.Empty;
}