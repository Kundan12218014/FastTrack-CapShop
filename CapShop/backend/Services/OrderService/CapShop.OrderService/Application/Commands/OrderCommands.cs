using CapShop.OrderService.Application.DTOs;
using CapShop.OrderService.Domain.Entities;
using CapShop.OrderService.Domain.Enums;
using CapShop.OrderService.Domain.Interfaces;
using CapShop.OrderService.Domain.ValueObjects;
using CapShop.Shared.Configuration;
using CapShop.Shared.Contracts.Orders;
using CapShop.Shared.Exceptions;
using CapShop.Shared.Messaging;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CapShop.OrderService.Application.Commands;

// ── Simulate Payment ──────────────────────────────────────────────────────

public record SimulatePaymentCommand(Guid UserId, string PaymentMethod);

public class SimulatePaymentCommandHandler
{
    private readonly IPaymentSimulationRepository _paymentRepository;
    private readonly ICartRepository _cartRepository;

    public SimulatePaymentCommandHandler(
        IPaymentSimulationRepository paymentRepository,
        ICartRepository cartRepository)
    {
        _paymentRepository = paymentRepository;
        _cartRepository = cartRepository;
    }

    public async Task<PaymentSimulationResponseDto> Handle(
        SimulatePaymentCommand command,
        CancellationToken ct = default)
    {
        // Verify cart exists and has items
        var cart = await _cartRepository.GetActiveCartByUserIdAsync(command.UserId, ct)
            ?? throw new DomainException("No active cart found. Add items before payment.");

        if (!cart.Items.Any())
            throw new DomainException("Cart is empty. Add items before payment.");

        // Simulate success/failure:
        // COD always succeeds. UPI/Card succeed 85% of the time.
        var isSuccess = command.PaymentMethod == PaymentMethod.COD
                     || new Random().Next(1, 101) <= 85;

        var failureReason = isSuccess ? null : "Transaction declined by bank. Please try again.";

        // Record the simulation — use a temp Guid as order placeholder
        var simulation = PaymentSimulation.Create(
            Guid.NewGuid(), // placeholder — real orderId assigned on place
            command.PaymentMethod,
            isSuccess,
            failureReason);

        await _paymentRepository.AddAsync(simulation, ct);
        await _paymentRepository.SaveChangesAsync(ct);

        return new PaymentSimulationResponseDto
        {
            IsSuccess = isSuccess,
            TransactionId = isSuccess ? simulation.TransactionId : string.Empty,
            FailureReason = failureReason,
            Message = isSuccess
                ? "Payment successful. Proceed to place your order."
                : "Payment failed. Please try a different payment method."
        };
    }
}

// ── Place Order ───────────────────────────────────────────────────────────

public record PlaceOrderCommand(
    Guid UserId,
    ShippingAddressDto ShippingAddress,
    string PaymentMethod,
    string TransactionId);

public class PlaceOrderCommandHandler
{
    private readonly ICartRepository _cartRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IMessagePublisher _messagePublisher;
    private readonly RabbitMqOptions _rabbitMqOptions;
    private readonly ILogger<PlaceOrderCommandHandler> _logger;

    public PlaceOrderCommandHandler(
        ICartRepository cartRepository,
        IOrderRepository orderRepository,
        IMessagePublisher messagePublisher,
        IOptions<RabbitMqOptions> rabbitMqOptions,
        ILogger<PlaceOrderCommandHandler> logger)
    {
        _cartRepository = cartRepository;
        _orderRepository = orderRepository;
        _messagePublisher = messagePublisher;
        _rabbitMqOptions = rabbitMqOptions.Value;
        _logger = logger;
    }

    public async Task<OrderDto> Handle(
        PlaceOrderCommand command,
        CancellationToken ct = default)
    {
        // 1. Get the active cart
        var cart = await _cartRepository.GetActiveCartByUserIdAsync(command.UserId, ct)
            ?? throw new DomainException("No active cart found.");

        if (!cart.Items.Any())
            throw new DomainException("Cannot place an order with an empty cart.");

        // 2. Build shipping address value object (validates pincode/phone)
        var address = new ShippingAddress(
            command.ShippingAddress.FullName,
            command.ShippingAddress.AddressLine,
            command.ShippingAddress.City,
            command.ShippingAddress.State,
            command.ShippingAddress.Pincode,
            command.ShippingAddress.PhoneNumber);

        // 3. Create order from cart items — snapshots prices at this moment
        var order = Order.Create(
            command.UserId,
            address,
            command.PaymentMethod,
            cart.Items.ToList());

        order.SetPaymentTransaction(command.TransactionId);

        // 4. Mark cart as converted — prevents it being modified again
        cart.MarkAsConverted();

        // 5. Persist order to SQL, then evict the cart from Redis
        await _orderRepository.AddAsync(order, ct);
        await _orderRepository.SaveChangesAsync(ct);
        await _cartRepository.DeleteAsync(command.UserId, ct); // Cart fully cleared in Redis
        await PublishOrderPlacedEventAsync(order, ct);

        return MapToDto(order);
    }

    private async Task PublishOrderPlacedEventAsync(Order order, CancellationToken ct)
    {
        var integrationEvent = new OrderPlacedIntegrationEvent(
            order.Id,
            order.OrderNumber,
            order.UserId,
            order.TotalAmount,
            order.PaymentMethod,
            order.Items.Sum(item => item.Quantity),
            order.PlacedAt);

        try
        {
            await _messagePublisher.PublishAsync(
                _rabbitMqOptions.OrderPlacedRoutingKey,
                integrationEvent,
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Order {OrderId} was saved but its RabbitMQ integration event could not be published.",
                order.Id);
        }
    }

    internal static OrderDto MapToDto(Order o) => new()
    {
        Id = o.Id,
        OrderNumber = o.OrderNumber,
        TotalAmount = o.TotalAmount,
        Status = o.Status.ToString(),
        PaymentMethod = o.PaymentMethod,
        TransactionId = o.PaymentTransactionId,
        PlacedAt = o.PlacedAt,
        ShippingAddress = new ShippingAddressDto
        {
            FullName = o.ShippingAddress.FullName,
            AddressLine = o.ShippingAddress.AddressLine,
            City = o.ShippingAddress.City,
            State = o.ShippingAddress.State,
            Pincode = o.ShippingAddress.Pincode,
            PhoneNumber = o.ShippingAddress.PhoneNumber
        },
        Items = o.Items.Select(i => new OrderItemDto
        {
            ProductId = i.ProductId,
            ProductName = i.ProductName,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            LineTotal = i.LineTotal
        }).ToList()
    };
}


// ── Cancel Order ──────────────────────────────────────────────────────────

public record CancelOrderCommand(Guid OrderId, Guid UserId, string Reason);

public class CancelOrderCommandHandler
{
    private readonly IOrderRepository _orderRepository;
    private readonly IMessagePublisher _messagePublisher;
    private readonly RabbitMqOptions _rabbitMqOptions;
    private readonly ILogger<CancelOrderCommandHandler> _logger;

    public CancelOrderCommandHandler(
        IOrderRepository orderRepository,
        IMessagePublisher messagePublisher,
        IOptions<RabbitMqOptions> rabbitMqOptions,
        ILogger<CancelOrderCommandHandler> logger)
    {
        _orderRepository = orderRepository;
        _messagePublisher = messagePublisher;
        _rabbitMqOptions = rabbitMqOptions.Value;
        _logger = logger;
    }

    public async Task Handle(CancelOrderCommand command, CancellationToken ct = default)
    {
        var order = await _orderRepository.GetByIdAsync(command.OrderId, ct)
            ?? throw new NotFoundException("Order", command.OrderId);

        // Customers can only cancel their own orders
        if (order.UserId != command.UserId)
            throw new ForbiddenException("You can only cancel your own orders.");

        // Status transition validation is enforced by the Order entity
        order.UpdateStatus(OrderStatus.Cancelled, command.UserId.ToString(), command.Reason);

        await _orderRepository.SaveChangesAsync(ct);
        await PublishOrderCancelledEventAsync(order, ct);
    }

    private async Task PublishOrderCancelledEventAsync(Order order, CancellationToken ct)
    {
        var items = order.Items.Select(i => new OrderCancelledItem(i.ProductId, i.Quantity)).ToList();

        var integrationEvent = new OrderCancelledIntegrationEvent(
            order.Id,
            order.OrderNumber,
            order.UserId,
            items,
            DateTime.UtcNow);

        try
        {
            await _messagePublisher.PublishAsync(
                _rabbitMqOptions.OrderCancelledRoutingKey,
                integrationEvent,
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Order {OrderId} was cancelled but its RabbitMQ integration event could not be published.",
                order.Id);
        }
    }
}
