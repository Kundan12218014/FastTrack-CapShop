namespace CapShop.Shared.Configuration;

public class RabbitMqOptions
{
    public const string SectionName = "RabbitMq";

    public bool Enabled { get; set; } = true;
    public string HostName { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string UserName { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public string VirtualHost { get; set; } = "/";
    public string ExchangeName { get; set; } = "capshop.events";
    public string OrderPlacedQueueName { get; set; } = "capshop.admin.orders.placed";
    public string OrderPlacedRoutingKey { get; set; } = "orders.placed";
}
