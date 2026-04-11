using System.Text;
using System.Text.Json;
using CapShop.CatalogService.Infrastructure.Persistence;
using CapShop.Shared.Configuration;
using CapShop.Shared.Contracts.Orders;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace CapShop.CatalogService.Application.Services;

public class OrderCancelledConsumer : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly RabbitMqOptions _options;
    private readonly ILogger<OrderCancelledConsumer> _logger;
    private IConnection? _connection;
    private IModel? _channel;

    public OrderCancelledConsumer(
        IServiceScopeFactory scopeFactory,
        IOptions<RabbitMqOptions> options,
        ILogger<OrderCancelledConsumer> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _logger = logger;
    }

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("RabbitMQ consumer is disabled for Catalog Service.");
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
        _channel.QueueDeclare(_options.OrderCancelledQueueName, durable: true, exclusive: false, autoDelete: false);
        _channel.QueueBind(_options.OrderCancelledQueueName, _options.ExchangeName, _options.OrderCancelledRoutingKey);
        _channel.BasicQos(0, 1, false);

        return base.StartAsync(cancellationToken);
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled || _channel is null)
        {
            return Task.CompletedTask;
        }

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.Received += async (_, eventArgs) =>
        {
            try
            {
                var payload = Encoding.UTF8.GetString(eventArgs.Body.ToArray());
                var message = JsonSerializer.Deserialize<OrderCancelledIntegrationEvent>(payload);

                if (message is null || message.Items is null)
                {
                    throw new InvalidOperationException("RabbitMQ message payload was empty or missing items.");
                }

                await RestockInventoryAsync(message, stoppingToken);
                _channel.BasicAck(eventArgs.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process RabbitMQ order cancelled message.");
                // Requeue message since it failed
                _channel.BasicNack(eventArgs.DeliveryTag, multiple: false, requeue: true);
            }
        };

        _channel.BasicConsume(_options.OrderCancelledQueueName, autoAck: false, consumer);
        return Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task RestockInventoryAsync(OrderCancelledIntegrationEvent message, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();

        foreach (var item in message.Items)
        {
            var product = await context.Products.FirstOrDefaultAsync(p => p.Id == item.ProductId, cancellationToken);
            if (product != null)
            {
                product.UpdateStock(product.StockQuantity + item.Quantity);
                _logger.LogInformation(
                    "Restocked {Quantity} units of product {ProductId} due to cancellation of order {OrderNumber}.",
                    item.Quantity, item.ProductId, message.OrderNumber);
            }
            else
            {
                _logger.LogWarning(
                    "Product {ProductId} not found when trying to restock from cancelled order {OrderNumber}.",
                    item.ProductId, message.OrderNumber);
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    public override void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        base.Dispose();
    }
}
