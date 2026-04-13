using System.Text;
using System.Text.Json;
using CapShop.OrderService.Domain.Enums;
using CapShop.OrderService.Domain.Interfaces;
using CapShop.Shared.Configuration;
using CapShop.Shared.Contracts.Orders;
using CapShop.Shared.Contracts.Saga;
using CapShop.Shared.Messaging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace CapShop.OrderService.Application.Services;

// ── Step 4a: Payment Failed Handler ──────────────────────────────────────────
// Listens for PaymentFailed → cancels order (no refund needed, payment didn't go through)

public class OrderSagaPaymentFailedConsumer : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly RabbitMqOptions _options;
    private readonly ILogger<OrderSagaPaymentFailedConsumer> _logger;
    private IConnection? _connection;
    private IModel? _channel;

    public OrderSagaPaymentFailedConsumer(
        IServiceScopeFactory scopeFactory,
        IOptions<RabbitMqOptions> options,
        ILogger<OrderSagaPaymentFailedConsumer> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _logger = logger;
    }

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_options.Enabled) return base.StartAsync(cancellationToken);

        var factory = new ConnectionFactory
        {
            HostName = _options.HostName, Port = _options.Port,
            UserName = _options.UserName, Password = _options.Password,
            VirtualHost = _options.VirtualHost, DispatchConsumersAsync = true
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();
        _channel.ExchangeDeclare(_options.ExchangeName, ExchangeType.Topic, durable: true, autoDelete: false);
        _channel.QueueDeclare(_options.SagaPaymentFailedQueueName, durable: true, exclusive: false, autoDelete: false);
        _channel.QueueBind(_options.SagaPaymentFailedQueueName, _options.ExchangeName, _options.SagaPaymentFailedRoutingKey);
        _channel.BasicQos(0, 1, false);

        return base.StartAsync(cancellationToken);
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled || _channel is null) return Task.CompletedTask;

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.Received += async (_, eventArgs) =>
        {
            try
            {
                var payload = Encoding.UTF8.GetString(eventArgs.Body.ToArray());
                var message = JsonSerializer.Deserialize<PaymentFailedIntegrationEvent>(payload);

                if (message is null) throw new InvalidOperationException("PaymentFailed event payload was null.");

                _logger.LogWarning("SAGA: Payment Failed for Order {OrderId}. Cancelling order.", message.OrderId);

                using var scope = _scopeFactory.CreateScope();
                var orderRepo = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
                var order = await orderRepo.GetByIdAsync(message.OrderId, stoppingToken);

                if (order != null)
                {
                    order.UpdateStatus(OrderStatus.Cancelled, "System (Saga)", $"Payment Failed: {message.Reason}");
                    await orderRepo.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation("SAGA: Order {OrderId} marked Cancelled due to payment failure.", message.OrderId);
                }

                _channel.BasicAck(eventArgs.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to handle PaymentFailed saga event.");
                _channel.BasicNack(eventArgs.DeliveryTag, multiple: false, requeue: true);
            }
        };

        _channel.BasicConsume(_options.SagaPaymentFailedQueueName, autoAck: false, consumer);
        return Task.Delay(Timeout.Infinite, stoppingToken);
    }

    public override void Dispose() { _channel?.Dispose(); _connection?.Dispose(); base.Dispose(); }
}

// ── Step 4b: Inventory Reserved Handler ──────────────────────────────────────
// Listens for InventoryReserved → marks order as Paid → publishes OrderPlacedEvent

public class OrderSagaInventoryReservedConsumer : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IMessagePublisher _publisher;
    private readonly RabbitMqOptions _options;
    private readonly ILogger<OrderSagaInventoryReservedConsumer> _logger;
    private IConnection? _connection;
    private IModel? _channel;

    public OrderSagaInventoryReservedConsumer(
        IServiceScopeFactory scopeFactory,
        IMessagePublisher publisher,
        IOptions<RabbitMqOptions> options,
        ILogger<OrderSagaInventoryReservedConsumer> logger)
    {
        _scopeFactory = scopeFactory;
        _publisher = publisher;
        _options = options.Value;
        _logger = logger;
    }

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_options.Enabled) return base.StartAsync(cancellationToken);

        var factory = new ConnectionFactory
        {
            HostName = _options.HostName, Port = _options.Port,
            UserName = _options.UserName, Password = _options.Password,
            VirtualHost = _options.VirtualHost, DispatchConsumersAsync = true
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();
        _channel.ExchangeDeclare(_options.ExchangeName, ExchangeType.Topic, durable: true, autoDelete: false);
        _channel.QueueDeclare(_options.SagaInventoryReservedQueueName, durable: true, exclusive: false, autoDelete: false);
        _channel.QueueBind(_options.SagaInventoryReservedQueueName, _options.ExchangeName, _options.SagaInventoryReservedRoutingKey);
        _channel.BasicQos(0, 1, false);

        return base.StartAsync(cancellationToken);
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled || _channel is null) return Task.CompletedTask;

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.Received += async (_, eventArgs) =>
        {
            try
            {
                var payload = Encoding.UTF8.GetString(eventArgs.Body.ToArray());
                var message = JsonSerializer.Deserialize<InventoryReservedIntegrationEvent>(payload);

                if (message is null) throw new InvalidOperationException("InventoryReserved event payload was null.");

                _logger.LogInformation("SAGA STEP 4: Inventory Reserved for Order {OrderId}. Marking as Paid.", message.OrderId);

                using var scope = _scopeFactory.CreateScope();
                var orderRepo = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
                var order = await orderRepo.GetByIdAsync(message.OrderId, stoppingToken);

                if (order != null)
                {
                    order.UpdateStatus(OrderStatus.Paid, "System (Saga)", "Payment verified and inventory reserved successfully.");
                    await orderRepo.SaveChangesAsync(stoppingToken);

                    // Publish the final OrderPlaced event for Admin dashboard metrics
                    var placedEvent = new OrderPlacedIntegrationEvent(
                        order.Id, order.OrderNumber, order.UserId, order.TotalAmount,
                        order.PaymentMethod, order.Items.Sum(i => i.Quantity), order.PlacedAt);

                    await _publisher.PublishAsync(_options.OrderPlacedRoutingKey, placedEvent, stoppingToken);
                    _logger.LogInformation("SAGA COMPLETE: Order {OrderId} is now Paid.", message.OrderId);
                }

                _channel.BasicAck(eventArgs.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to handle InventoryReserved saga event.");
                _channel.BasicNack(eventArgs.DeliveryTag, multiple: false, requeue: true);
            }
        };

        _channel.BasicConsume(_options.SagaInventoryReservedQueueName, autoAck: false, consumer);
        return Task.Delay(Timeout.Infinite, stoppingToken);
    }

    public override void Dispose() { _channel?.Dispose(); _connection?.Dispose(); base.Dispose(); }
}

// ── Step 4c: Inventory Failed Handler (Compensation) ─────────────────────────
// Listens for InventoryReservationFailed → cancels order → requests refund

public class OrderSagaInventoryFailedConsumer : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IMessagePublisher _publisher;
    private readonly RabbitMqOptions _options;
    private readonly ILogger<OrderSagaInventoryFailedConsumer> _logger;
    private IConnection? _connection;
    private IModel? _channel;

    public OrderSagaInventoryFailedConsumer(
        IServiceScopeFactory scopeFactory,
        IMessagePublisher publisher,
        IOptions<RabbitMqOptions> options,
        ILogger<OrderSagaInventoryFailedConsumer> logger)
    {
        _scopeFactory = scopeFactory;
        _publisher = publisher;
        _options = options.Value;
        _logger = logger;
    }

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_options.Enabled) return base.StartAsync(cancellationToken);

        var factory = new ConnectionFactory
        {
            HostName = _options.HostName, Port = _options.Port,
            UserName = _options.UserName, Password = _options.Password,
            VirtualHost = _options.VirtualHost, DispatchConsumersAsync = true
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();
        _channel.ExchangeDeclare(_options.ExchangeName, ExchangeType.Topic, durable: true, autoDelete: false);
        _channel.QueueDeclare(_options.SagaInventoryReservationFailedQueueName, durable: true, exclusive: false, autoDelete: false);
        _channel.QueueBind(_options.SagaInventoryReservationFailedQueueName, _options.ExchangeName, _options.SagaInventoryReservationFailedRoutingKey);
        _channel.BasicQos(0, 1, false);

        return base.StartAsync(cancellationToken);
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled || _channel is null) return Task.CompletedTask;

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.Received += async (_, eventArgs) =>
        {
            try
            {
                var payload = Encoding.UTF8.GetString(eventArgs.Body.ToArray());
                var message = JsonSerializer.Deserialize<InventoryReservationFailedIntegrationEvent>(payload);

                if (message is null) throw new InvalidOperationException("InventoryReservationFailed event payload was null.");

                _logger.LogWarning("SAGA COMPENSATION: Inventory failed for Order {OrderId}. Cancelling and requesting refund.", message.OrderId);

                using var scope = _scopeFactory.CreateScope();
                var orderRepo = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
                var order = await orderRepo.GetByIdAsync(message.OrderId, stoppingToken);

                if (order != null)
                {
                    order.UpdateStatus(OrderStatus.Cancelled, "System (Saga)", $"Inventory Reservation Failed: {message.Reason}");
                    await orderRepo.SaveChangesAsync(stoppingToken);

                    // Trigger compensation — payment must be reversed since payment succeeded in Step 2
                    await _publisher.PublishAsync(
                        _options.SagaRefundRequestedRoutingKey,
                        new RefundRequestedIntegrationEvent(order.Id, message.Reason, DateTime.UtcNow),
                        stoppingToken);

                    _logger.LogInformation("SAGA: Refund requested for Order {OrderId}.", message.OrderId);
                }

                _channel.BasicAck(eventArgs.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to handle InventoryReservationFailed saga event.");
                _channel.BasicNack(eventArgs.DeliveryTag, multiple: false, requeue: true);
            }
        };

        _channel.BasicConsume(_options.SagaInventoryReservationFailedQueueName, autoAck: false, consumer);
        return Task.Delay(Timeout.Infinite, stoppingToken);
    }

    public override void Dispose() { _channel?.Dispose(); _connection?.Dispose(); base.Dispose(); }
}
