using System.Text;
using System.Text.Json;
using CapShop.Shared.Configuration;
using CapShop.Shared.Contracts.Saga;
using CapShop.Shared.Messaging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace CapShop.AdminService.Application.Services;

// ── Step 2: Payment Saga ─────────────────────────────────────────────────────
// Listens for OrderCheckoutInitiated → simulates payment → emits Completed/Failed

public class PaymentSagaConsumer : BackgroundService
{
    private readonly IMessagePublisher _publisher;
    private readonly RabbitMqOptions _options;
    private readonly ILogger<PaymentSagaConsumer> _logger;
    private IConnection? _connection;
    private IModel? _channel;

    public PaymentSagaConsumer(
        IMessagePublisher publisher,
        IOptions<RabbitMqOptions> options,
        ILogger<PaymentSagaConsumer> logger)
    {
        _publisher = publisher;
        _options = options.Value;
        _logger = logger;
    }

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("RabbitMQ PaymentSagaConsumer is disabled.");
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
        _channel.QueueDeclare(_options.SagaOrderCheckoutInitiatedQueueName, durable: true, exclusive: false, autoDelete: false);
        _channel.QueueBind(_options.SagaOrderCheckoutInitiatedQueueName, _options.ExchangeName, _options.SagaOrderCheckoutInitiatedRoutingKey);
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
                var message = JsonSerializer.Deserialize<OrderCheckoutInitiatedIntegrationEvent>(payload);

                if (message is null)
                    throw new InvalidOperationException("Saga checkout event payload was null.");

                _logger.LogInformation("SAGA STEP 2: Processing Payment for Order {OrderId}, Total: {Total}", message.OrderId, message.TotalAmount);

                // Simulate payment: COD always succeeds, others 85%
                var isSuccess = message.PaymentMethod == "COD" || new Random().Next(1, 101) <= 85;

                if (isSuccess)
                {
                    _logger.LogInformation("SAGA: Payment Authorized for Order {OrderId}.", message.OrderId);
                    await _publisher.PublishAsync(
                        _options.SagaPaymentCompletedRoutingKey,
                        new PaymentCompletedIntegrationEvent(
                            message.OrderId,
                            message.PaymentMethod,
                            Guid.NewGuid().ToString("N"),
                            message.Items,
                            DateTime.UtcNow),
                        stoppingToken);
                }
                else
                {
                    _logger.LogWarning("SAGA: Payment Declined for Order {OrderId}.", message.OrderId);
                    await _publisher.PublishAsync(
                        _options.SagaPaymentFailedRoutingKey,
                        new PaymentFailedIntegrationEvent(
                            message.OrderId,
                            "Bank declined the transaction. Please retry.",
                            DateTime.UtcNow),
                        stoppingToken);
                }

                _channel.BasicAck(eventArgs.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process Saga checkout message.");
                _channel.BasicNack(eventArgs.DeliveryTag, multiple: false, requeue: true);
            }
        };

        _channel.BasicConsume(_options.SagaOrderCheckoutInitiatedQueueName, autoAck: false, consumer);
        return Task.Delay(Timeout.Infinite, stoppingToken);
    }

    public override void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        base.Dispose();
    }
}

// ── Compensation: Refund ─────────────────────────────────────────────────────
// Listens for RefundRequested → reverses the simulated payment (compensation)

public class RefundSagaConsumer : BackgroundService
{
    private readonly RabbitMqOptions _options;
    private readonly ILogger<RefundSagaConsumer> _logger;
    private IConnection? _connection;
    private IModel? _channel;

    public RefundSagaConsumer(
        IOptions<RabbitMqOptions> options,
        ILogger<RefundSagaConsumer> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("RabbitMQ RefundSagaConsumer is disabled.");
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
        _channel.QueueDeclare(_options.SagaRefundRequestedQueueName, durable: true, exclusive: false, autoDelete: false);
        _channel.QueueBind(_options.SagaRefundRequestedQueueName, _options.ExchangeName, _options.SagaRefundRequestedRoutingKey);
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
                var message = JsonSerializer.Deserialize<RefundRequestedIntegrationEvent>(payload);

                if (message is null)
                    throw new InvalidOperationException("Refund event payload was null.");

                _logger.LogInformation("SAGA COMPENSATION: Reversing payment for Order {OrderId}. Reason: {Reason}", message.OrderId, message.Reason);
                await Task.Delay(300, stoppingToken); // Simulate gateway API latency
                _logger.LogInformation("SAGA COMPENSATION DONE: Refund issued for Order {OrderId}.", message.OrderId);

                _channel.BasicAck(eventArgs.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process Refund event.");
                _channel.BasicNack(eventArgs.DeliveryTag, multiple: false, requeue: true);
            }
        };

        _channel.BasicConsume(_options.SagaRefundRequestedQueueName, autoAck: false, consumer);
        return Task.Delay(Timeout.Infinite, stoppingToken);
    }

    public override void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        base.Dispose();
    }
}
