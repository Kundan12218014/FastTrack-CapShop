using System;
using System.Collections.Generic;
using CapShop.Shared.Contracts.Orders;

namespace CapShop.Shared.Contracts.Saga;

// Step 1: Order initiated (Status: PaymentPending) -> Triggers Payment
public record OrderCheckoutInitiatedIntegrationEvent(
    Guid OrderId,
    string OrderNumber,
    Guid UserId,
    decimal TotalAmount,
    string PaymentMethod,
    List<OrderCancelledItem> Items,
    DateTime PlacedAt);

// Step 2a: Payment Succeeded -> Triggers Inventory
public record PaymentCompletedIntegrationEvent(
    Guid OrderId,
    string PaymentMethod,
    string TransactionId,
    List<OrderCancelledItem> Items,
    DateTime ProcessedAt);

// Step 2b: Payment Failed -> Triggers Order Cancellation
public record PaymentFailedIntegrationEvent(
    Guid OrderId,
    string Reason,
    DateTime ProcessedAt);

// Step 3a: Inventory Reserved -> Triggers Order Completion (Status: Paid)
public record InventoryReservedIntegrationEvent(
    Guid OrderId,
    DateTime ReservedAt);

// Step 3b: Inventory Failed -> Triggers Order Cancellation & Refund Request
public record InventoryReservationFailedIntegrationEvent(
    Guid OrderId,
    string Reason,
    DateTime FailedAt);

// Step 4: Refund Compensation -> Triggers Payment Reversal
public record RefundRequestedIntegrationEvent(
    Guid OrderId,
    string Reason,
    DateTime RequestedAt);
