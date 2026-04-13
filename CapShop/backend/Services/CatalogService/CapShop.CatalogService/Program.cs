using CapShop.CatalogService.Application.Queries;
using CapShop.CatalogService.Domain.Interfaces;
using CapShop.CatalogService.Infrastructure.Persistence;
using CapShop.CatalogService.Infrastructure.Persistence.Repositories;
using CapShop.Shared.Middleware;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;


var builder = WebApplication.CreateBuilder(args);

// ══════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════
// 1. DATABASE & CACHING
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddDbContext<CatalogDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql => sql.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null)));

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    options.InstanceName = "CapShop.CatalogService:";
});

// ══════════════════════════════════════════════════════════════════════════
// 2. DEPENDENCY INJECTION
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();

// Application query handlers
builder.Services.AddScoped<GetProductsQueryHandler>();
builder.Services.AddScoped<GetProductByIdQueryHandler>();
builder.Services.AddScoped<GetFeaturedProductsQueryHandler>();
builder.Services.AddScoped<GetCategoriesQueryHandler>();

builder.Services.Configure<CapShop.Shared.Configuration.RabbitMqOptions>(
    builder.Configuration.GetSection(CapShop.Shared.Configuration.RabbitMqOptions.SectionName));

CapShop.Shared.Messaging.ServiceCollectionExtensions.AddRabbitMqMessaging(builder.Services, builder.Configuration);

// Add background workers
builder.Services.AddHostedService<CapShop.CatalogService.Application.Services.OrderCancelledConsumer>();
builder.Services.AddHostedService<CapShop.CatalogService.Application.Services.InventoryReservationConsumer>();

// ══════════════════════════════════════════════════════════════════════════
// 3. SWAGGER
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CapShop – Catalog Service",
        Version = "v1",
        Description = "Product browsing, search, filtering and category management."
    });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. CORS
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddCors(options =>
    options.AddPolicy("GatewayOnly", policy =>
        policy.WithOrigins(
                  "https://localhost:5000",
                  "http://localhost:5010",
                  "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()));

builder.Services.AddControllers();

// ══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE PIPELINE
// ══════════════════════════════════════════════════════════════════════════
var app = builder.Build();
var isContainerEnvironment = app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker");

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<CorrelationIdMiddleware>();

if (isContainerEnvironment)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CapShop Catalog Service v1");
        c.RoutePrefix = string.Empty;
    });
}

// Skip HTTPS redirect in development — Ocelot talks to us on HTTP
if (!isContainerEnvironment)
    app.UseHttpsRedirection();

app.UseCors("GatewayOnly");
app.MapControllers();

// Auto-apply migrations in Development
if (isContainerEnvironment)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();
