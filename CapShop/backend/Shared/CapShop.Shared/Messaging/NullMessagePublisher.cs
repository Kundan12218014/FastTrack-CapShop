namespace CapShop.Shared.Messaging;

public class NullMessagePublisher : IMessagePublisher
{
    public Task PublishAsync<TMessage>(string routingKey, TMessage message, CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
