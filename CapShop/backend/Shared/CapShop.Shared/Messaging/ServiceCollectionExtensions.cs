using CapShop.Shared.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CapShop.Shared.Messaging;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddRabbitMqMessaging(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<RabbitMqOptions>(configuration.GetSection(RabbitMqOptions.SectionName));

        var options = configuration.GetSection(RabbitMqOptions.SectionName).Get<RabbitMqOptions>() ?? new RabbitMqOptions();

        if (!options.Enabled)
        {
            services.AddSingleton<IMessagePublisher, NullMessagePublisher>();
            return services;
        }

        services.AddSingleton<IMessagePublisher, RabbitMqMessagePublisher>();
        return services;
    }
}
