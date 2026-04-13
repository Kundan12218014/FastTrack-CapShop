using System.Text;
using System.Text.Json;
using CapShop.CatalogService.Infrastructure.Persistence;
using CapShop.Shared.Configuration;
using CapShop.Shared.Contracts.Saga;
using CapShop.Shared.Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace CapShop.CatalogService.Application.Services;

// ── Step 3: Inventory Reservation ────────────────────────────────────────────
// Listens for PaymentCompleted → reserves inventory → emits Reserved/Failed

public class InventoryReservationConsumer : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IMessagePublisher _publisher;
    private readonly RabbitMqOptions _options;
    private readonly ILogger<InventoryReservationConsumer> _logger;
    private IConnection? _connection;
    private IModel? _channel;

    public InventoryReservationConsumer(
        IServiceScopeFactory scopeFactory,
        IMessagePublisher publisher,
        IOptions<RabbitMqOptions> options,
        ILogger<InventoryReservationConsumer> logger)
    {
        _scopeFactory = scopeFactory;
        _publisher = publisher;
        _options = options.Value;
        _logger = logger;
    }

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("RabbitMQ InventoryReservationConsumer is disabled.");
            return base.StartAsync(cancellationToken);
        }

        var factory = new ConnectionFactory
        {
            HostName = _options.HostName,
            Port = _options.Port,
            UserName = _options.UserName,
            Password = _options.Password,
            VirtualHost = _options.VirtualHost,
            DispatchConsumersAsync = true
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();
        _channel.ExchangeDeclare(_options.ExchangeName, ExchangeType.Topic, durable: true, autoDelete: false);
        _channel.QueueDeclare(_options.SagaPaymentCompletedQueueName, durable: true, exclusive: false, autoDelete: false);
        _channel.QueueBind(_options.SagaPaymentCompletedQueueName, _options.ExchangeName, _options.SagaPaymentCompletedRoutingKey);
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
                var message = JsonSerializer.Deserialize<PaymentCompletedIntegrationEvent>(payload);

                if (message is null)
                    throw new InvalidOperationException("Saga payment completed event payload was null.");

                _logger.LogInformation("SAGA STEP 3: Reserving Inventory for Order {OrderId}.", message.OrderId);

                // NOTE: PaymentCompletedIntegrationEvent doesn't carry item quantities because 
                // CatalogService and OrderService have isolated DBs (Database-per-Service pattern).
                // In production, you'd pass item data in the event payload. For now we emit success 
                // immediately — the actual stock deduction already happened via OrderCancelledConsumer.
                var reservationSucceeded = true;

                if (reservationSucceeded)
                {
                    _logger.LogInformation("SAGA: Inventory reserved for Order {OrderId}.", message.OrderId);
                    await _publisher.PublishAsync(
                        _options.SagaInventoryReservedRoutingKey,
                        new InventoryReservedIntegrationEvent(message.OrderId, DateTime.UtcNow),
                        stoppingToken);
                }
                else
                {
                    _logger.LogWarning("SAGA: Inventory reservation failed for Order {OrderId}.", message.OrderId);
                    await _publisher.PublishAsync(
                        _options.SagaInventoryReservationFailedRoutingKey,
                        new InventoryReservationFailedIntegrationEvent(
                            message.OrderId,
                            "One or more items are out of stock.",
                            DateTime.UtcNow),
                        stoppingToken);
                }

                _channel.BasicAck(eventArgs.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process Saga PaymentCompleted message.");
                _channel.BasicNack(eventArgs.DeliveryTag, multiple: false, requeue: true);
            }
        };

        _channel.BasicConsume(_options.SagaPaymentCompletedQueueName, autoAck: false, consumer);
        return Task.Delay(Timeout.Infinite, stoppingToken);
    }

    public override void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        base.Dispose();
    }
}
