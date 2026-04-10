using System.Text;
using CapShop.OrderService.Application.Commands;
using CapShop.OrderService.Application.Queries;
using CapShop.OrderService.Application.Validators;
using CapShop.OrderService.Domain.Interfaces;
using CapShop.OrderService.Infrastructure.Persistence;
using CapShop.OrderService.Infrastructure.Persistence.Repositories;
using CapShop.Shared.Middleware;
using CapShop.Shared.Messaging;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);
    
// ══════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════
// 1. DATABASE & CACHING
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddDbContext<OrderDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql => sql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(30), null)));

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    options.InstanceName = "CapShop.OrderService:";
});
builder.Services.AddRabbitMqMessaging(builder.Configuration);

// ══════════════════════════════════════════════════════════════════════════
// 2. DEPENDENCY INJECTION
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IPaymentSimulationRepository, PaymentRepository>();

// Commands
builder.Services.AddScoped<AddToCartCommandHandler>();
builder.Services.AddScoped<UpdateCartItemCommandHandler>();
builder.Services.AddScoped<RemoveCartItemCommandHandler>();
builder.Services.AddScoped<SimulatePaymentCommandHandler>();
builder.Services.AddScoped<PlaceOrderCommandHandler>();
builder.Services.AddScoped<CancelOrderCommandHandler>();

// Queries
builder.Services.AddScoped<GetCartQueryHandler>();
builder.Services.AddScoped<GetMyOrdersQueryHandler>();
builder.Services.AddScoped<GetOrderByIdQueryHandler>();

builder.Services.AddControllers();

// ══════════════════════════════════════════════════════════════════════════
// 3. VALIDATION
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<AddToCartValidator>();

// ══════════════════════════════════════════════════════════════════════════
// 4. JWT AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════════
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]
    ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured.");

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        options.Events = new JwtBearerEvents
        {
            OnChallenge = async ctx =>
            {
                ctx.HandleResponse();
                ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                ctx.Response.ContentType = "application/json";
                await ctx.Response.WriteAsync(
                    """{"success":false,"message":"Authentication required."}""");
            }
        };
    });

builder.Services.AddAuthorization();

// ══════════════════════════════════════════════════════════════════════════
// 5. SWAGGER (v10 / OpenAPI v2 Delegate Syntax)
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CapShop – Order Service",
        Version = "v1",
        Description = "Cart management, checkout, payment simulation, and order lifecycle."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste your JWT token here."
    });

    // Valid Swashbuckle v10 syntax using the delegate and OpenApiSecuritySchemeReference
    //options.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    //{
    //    {
    //        new OpenApiSecuritySchemeReference("Bearer"),
    //        new List<string>()
    //    }
    //});
});

// ══════════════════════════════════════════════════════════════════════════
// 6. CORS
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddCors(options =>
    options.AddPolicy("GatewayOnly", policy =>
        policy.WithOrigins(
                  "https://localhost:5000",
                  "http://localhost:5010",
                  "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()));

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
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CapShop Order Service v1");
        c.RoutePrefix = string.Empty;
    });

    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
    await db.Database.MigrateAsync();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors("GatewayOnly");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
