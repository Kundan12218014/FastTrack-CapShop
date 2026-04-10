namespace CapShop.Shared.Messaging;

public interface IMessagePublisher
{
    Task PublishAsync<TMessage>(string routingKey, TMessage message, CancellationToken cancellationToken = default);
}
