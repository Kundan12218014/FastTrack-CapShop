using System.Text;
using System.Text.Json;
using CapShop.AdminService.Domain.Entities;
using CapShop.AdminService.Domain.Interfaces;
using CapShop.Shared.Configuration;
using CapShop.Shared.Contracts.Orders;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace CapShop.AdminService.Application.Services;

public class OrderPlacedConsumer : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly RabbitMqOptions _options;
    private readonly ILogger<OrderPlacedConsumer> _logger;
    private IConnection? _connection;
    private IModel? _channel;

    public OrderPlacedConsumer(
        IServiceScopeFactory scopeFactory,
        IOptions<RabbitMqOptions> options,
        ILogger<OrderPlacedConsumer> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _logger = logger;
    }

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("RabbitMQ consumer is disabled for Admin Service.");
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
        _channel.QueueDeclare(_options.OrderPlacedQueueName, durable: true, exclusive: false, autoDelete: false);
        _channel.QueueBind(_options.OrderPlacedQueueName, _options.ExchangeName, _options.OrderPlacedRoutingKey);
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
                var message = JsonSerializer.Deserialize<OrderPlacedIntegrationEvent>(payload);

                if (message is null)
                {
                    throw new InvalidOperationException("RabbitMQ message payload was empty.");
                }

                await PersistAuditLogAsync(message, stoppingToken);
                _channel.BasicAck(eventArgs.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process RabbitMQ order placed message.");
                _channel.BasicNack(eventArgs.DeliveryTag, multiple: false, requeue: true);
            }
        };

        _channel.BasicConsume(_options.OrderPlacedQueueName, autoAck: false, consumer);
        return Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task PersistAuditLogAsync(OrderPlacedIntegrationEvent message, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var auditLogRepository = scope.ServiceProvider.GetRequiredService<IAuditLogRepository>();

        var log = AuditLog.Create(
            adminId: "system:rabbitmq",
            action: "OrderPlacedEventConsumed",
            entityType: "Order",
            entityId: message.OrderId.ToString(),
            details: $"Order {message.OrderNumber} for user {message.UserId} was placed with {message.ItemCount} item(s), total {message.TotalAmount:F2}, payment via {message.PaymentMethod}.");

        await auditLogRepository.AddAsync(log, cancellationToken);
        await auditLogRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Consumed order placed message for order {OrderId}.", message.OrderId);
    }

    public override void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        base.Dispose();
    }
}
