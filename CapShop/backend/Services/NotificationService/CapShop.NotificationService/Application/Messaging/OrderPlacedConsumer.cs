using System.Text;
using System.Text.Json;
using CapShop.NotificationService.Domain.Entities;
using CapShop.NotificationService.Infrastructure.Persistence;
using CapShop.NotificationService.Infrastructure.Services;
using CapShop.Shared.Configuration;
using CapShop.Shared.Contracts.Orders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace CapShop.NotificationService.Application.Messaging;

public class OrderPlacedConsumer : BackgroundService
{
  private readonly RabbitMqOptions _options;
  private readonly IServiceProvider _serviceProvider;
  private readonly OrderEmailService _orderEmailService;
  private readonly ILogger<OrderPlacedConsumer> _logger;
  private IConnection? _connection;
  private IModel? _channel;

  public OrderPlacedConsumer(
      IOptions<RabbitMqOptions> options,
      IServiceProvider serviceProvider,
      OrderEmailService orderEmailService,
      ILogger<OrderPlacedConsumer> logger)
  {
    _options = options.Value;
    _serviceProvider = serviceProvider;
    _orderEmailService = orderEmailService;
    _logger = logger;
    InitRabbitMq();
  }

  private void InitRabbitMq()
  {
    if (!_options.Enabled)
    {
      _logger.LogInformation("RabbitMQ consumer disabled.");
      return;
    }

    try
    {
      var factory = new ConnectionFactory
      {
        HostName = _options.HostName,
        Port = _options.Port,
        UserName = _options.UserName,
        Password = _options.Password,
        DispatchConsumersAsync = true
      };

      _connection = factory.CreateConnection();
      _channel = _connection.CreateModel();

      _channel.ExchangeDeclare("CapshopExchange", ExchangeType.Topic, durable: true);
      _channel.QueueDeclare("NotificationService_OrderQueue", durable: true, exclusive: false, autoDelete: false);
      _channel.QueueBind("NotificationService_OrderQueue", "CapshopExchange", "order.placed");

      _logger.LogInformation("RabbitMQ initialized successfully in NotificationService.");
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Failed to connect to RabbitMQ");
    }
  }

  protected override Task ExecuteAsync(CancellationToken stoppingToken)
  {
    if (_channel == null || !_channel.IsOpen) return Task.CompletedTask;

    var consumer = new AsyncEventingBasicConsumer(_channel);
    consumer.Received += async (model, ea) =>
    {
      var body = ea.Body.ToArray();
      var text = Encoding.UTF8.GetString(body);

      try
      {
        var evt = JsonSerializer.Deserialize<OrderPlacedIntegrationEvent>(text);
        if (evt != null)
        {
          using var scope = _serviceProvider.CreateScope();
          var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

          var notification = new Notification
          {
            UserId = evt.UserId,
            Title = "Order Placed Successfully",
            Message = $"Your order {evt.OrderNumber} has been placed successfully for {evt.TotalAmount:C}. Payment Method: {evt.PaymentMethod}.",
            CreatedAtUtc = DateTime.UtcNow,
            IsRead = false,
            EmailStatus = "Pending"
          };

          db.Notifications.Add(notification);
          await db.SaveChangesAsync(stoppingToken);
          _logger.LogInformation($"Order {evt.OrderNumber} notification stored for User {evt.UserId}");

          var emailResult = await _orderEmailService.SendOrderPlacedAcknowledgementAsync(evt, stoppingToken);
          notification.EmailStatus = emailResult.Success ? "Sent" : "Failed";
          notification.EmailFailureReason = emailResult.ErrorMessage;
          await db.SaveChangesAsync(stoppingToken);
        }

        _channel.BasicAck(ea.DeliveryTag, multiple: false);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error processing order placed event.");
        _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: true);
      }
    };

    _channel.BasicConsume("NotificationService_OrderQueue", autoAck: false, consumer);
    return Task.CompletedTask;
  }

  public override void Dispose()
  {
    _channel?.Dispose();
    _connection?.Dispose();
    base.Dispose();
  }
}