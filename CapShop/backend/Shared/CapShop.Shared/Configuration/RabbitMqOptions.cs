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
    public string NotificationOrderPlacedQueueName { get; set; } = "capshop.notification.orders.placed";
    public string OrderCancelledQueueName { get; set; } = "capshop.catalog.orders.cancelled";
    public string OrderCancelledRoutingKey { get; set; } = "orders.cancelled";

    // ── Saga ────────────────────────────────────────────────────────────────
    public string SagaOrderCheckoutInitiatedQueueName { get; set; } = "capshop.admin.saga.checkout.initiated";
    public string SagaOrderCheckoutInitiatedRoutingKey { get; set; } = "saga.checkout.initiated";

    public string SagaPaymentCompletedQueueName { get; set; } = "capshop.catalog.saga.payment.completed";
    public string SagaPaymentCompletedRoutingKey { get; set; } = "saga.payment.completed";

    public string SagaPaymentFailedQueueName { get; set; } = "capshop.order.saga.payment.failed";
    public string SagaPaymentFailedRoutingKey { get; set; } = "saga.payment.failed";

    public string SagaInventoryReservedQueueName { get; set; } = "capshop.order.saga.inventory.reserved";
    public string SagaInventoryReservedRoutingKey { get; set; } = "saga.inventory.reserved";

    public string SagaInventoryReservationFailedQueueName { get; set; } = "capshop.order.saga.inventory.failed";
    public string SagaInventoryReservationFailedRoutingKey { get; set; } = "saga.inventory.failed";

    public string SagaRefundRequestedQueueName { get; set; } = "capshop.admin.saga.refund.requested";
    public string SagaRefundRequestedRoutingKey { get; set; } = "saga.refund.requested";
}
