using System.Text;
using System.Text.Json;
using CapShop.Shared.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace CapShop.Shared.Messaging;

public class RabbitMqMessagePublisher : IMessagePublisher, IDisposable
{
    private readonly RabbitMqOptions _options;
    private readonly ILogger<RabbitMqMessagePublisher> _logger;
    private readonly IConnection? _connection;

    public RabbitMqMessagePublisher(
        IOptions<RabbitMqOptions> options,
        ILogger<RabbitMqMessagePublisher> logger)
    {
        _options = options.Value;
        _logger = logger;

        if (!_options.Enabled)
        {
            return;
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
    }

    public Task PublishAsync<TMessage>(string routingKey, TMessage message, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!_options.Enabled || _connection is null)
        {
            return Task.CompletedTask;
        }

        using var channel = _connection.CreateModel();
        channel.ExchangeDeclare(
            exchange: _options.ExchangeName,
            type: ExchangeType.Topic,
            durable: true,
            autoDelete: false);

        var body = JsonSerializer.SerializeToUtf8Bytes(message);
        var properties = channel.CreateBasicProperties();
        properties.Persistent = true;
        properties.ContentType = "application/json";

        channel.BasicPublish(
            exchange: _options.ExchangeName,
            routingKey: routingKey,
            basicProperties: properties,
            body: body);

        _logger.LogInformation("Published RabbitMQ message for routing key {RoutingKey}.", routingKey);
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _connection?.Dispose();
    }
}
