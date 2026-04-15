using System.Text;
using System.Text.Json;
using System.Data;
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

                if (message.Items is null || message.Items.Count == 0)
                {
                    throw new InvalidOperationException(
                        $"PaymentCompleted event for order {message.OrderId} did not include any items.");
                }

                var reservationSucceeded = await TryReserveInventoryAsync(message, stoppingToken);

                if (reservationSucceeded)
                {
                    _logger.LogInformation("SAGA: Inventory reserved for Order {OrderId}.", message.OrderId);
                    await _publisher.PublishAsync(
                        _options.SagaInventoryReservedRoutingKey,
                        new InventoryReservedIntegrationEvent(message.OrderId, message.PaymentMethod, DateTime.UtcNow),
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

    private async Task<bool> TryReserveInventoryAsync(
        PaymentCompletedIntegrationEvent message,
        CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();

        await using var transaction = await context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var groupedItems = message.Items
            .GroupBy(item => item.ProductId)
            .Select(group => new
            {
                ProductId = group.Key,
                Quantity = group.Sum(item => item.Quantity)
            })
            .ToList();

        var productIds = groupedItems.Select(item => item.ProductId).ToList();

        var products = await context.Products
            .Where(product => productIds.Contains(product.Id))
            .ToDictionaryAsync(product => product.Id, cancellationToken);

        foreach (var item in groupedItems)
        {
            if (!products.TryGetValue(item.ProductId, out var product))
            {
                _logger.LogWarning(
                    "SAGA: Product {ProductId} was not found while reserving stock for order {OrderId}.",
                    item.ProductId,
                    message.OrderId);
                await transaction.RollbackAsync(cancellationToken);
                return false;
            }

            if (product.StockQuantity < item.Quantity)
            {
                _logger.LogWarning(
                    "SAGA: Not enough stock for product {ProductId} on order {OrderId}. Requested {Requested}, available {Available}.",
                    item.ProductId,
                    message.OrderId,
                    item.Quantity,
                    product.StockQuantity);
                await transaction.RollbackAsync(cancellationToken);
                return false;
            }
        }

        foreach (var item in groupedItems)
        {
            var product = products[item.ProductId];
            product.UpdateStock(product.StockQuantity - item.Quantity);

            _logger.LogInformation(
                "Reserved {Quantity} units of product {ProductId} for order {OrderId}. Remaining stock: {Remaining}.",
                item.Quantity,
                item.ProductId,
                message.OrderId,
                product.StockQuantity);
        }

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public override void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        base.Dispose();
    }
}
