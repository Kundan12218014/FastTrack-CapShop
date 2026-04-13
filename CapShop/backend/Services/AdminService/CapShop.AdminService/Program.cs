using System.Text;
using System.Security.Claims;
using CapShop.AdminService.Application.Services;
using CapShop.AdminService.Domain.Interfaces;
using CapShop.AdminService.Infrastructure.Persistence;
using CapShop.AdminService.Infrastructure.Persistence.Repositories;
using CapShop.Shared.Middleware;
using CapShop.Shared.Messaging;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// ══════════════════════════════════════════════════════════════════════════
// 1. DATABASE
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddDbContext<AdminDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql => sql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(30), null)));

// ══════════════════════════════════════════════════════════════════════════
// 2. DEPENDENCY INJECTION
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddScoped<IAdminProductRepository, AdminProductRepository>();
builder.Services.AddScoped<IAdminOrderRepository, AdminOrderRepository>();
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
builder.Services.AddScoped<IReportsRepository, ReportsRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<ReportExportService>();
builder.Services.AddRabbitMqMessaging(builder.Configuration);
builder.Services.AddHostedService<OrderPlacedConsumer>();
builder.Services.AddHostedService<PaymentSagaConsumer>();
builder.Services.AddHostedService<RefundSagaConsumer>();
// ══════════════════════════════════════════════════════════════════════════
// 3. VALIDATION
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddFluentValidationAutoValidation();

// ══════════════════════════════════════════════════════════════════════════
// 4. JWT AUTHENTICATION — must match Auth Service exactly
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
            IssuerSigningKey = new SymmetricSecurityKey(
                                           Encoding.UTF8.GetBytes(secretKey)),
            ClockSkew = TimeSpan.FromSeconds(30),
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.NameIdentifier
        };

        options.Events = new JwtBearerEvents
        {
            // TEMP DEBUG START: Remove after authentication troubleshooting.
            OnMessageReceived = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("Admin.JwtDebug");

                var authHeader = context.Request.Headers.Authorization.ToString();
                var hasAuthHeader = !string.IsNullOrWhiteSpace(authHeader);
                var hasBearerPrefix = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase);

                logger.LogInformation(
                    "JWT incoming request. Path: {Path}. Authorization header present: {HasAuthHeader}. Bearer scheme used: {HasBearerPrefix}.",
                    context.Request.Path,
                    hasAuthHeader,
                    hasBearerPrefix);

                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("Admin.JwtDebug");

                logger.LogWarning(
                    context.Exception,
                    "JWT validation failed for path {Path}. Reason: {Message}",
                    context.Request.Path,
                    context.Exception.Message);

                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                if (context.Principal?.Identity is ClaimsIdentity identity)
                {
                    var hasStandardRole = identity.HasClaim(c => c.Type == ClaimTypes.Role);
                    if (!hasStandardRole)
                    {
                        var customRole = identity.FindFirst("role")?.Value;
                        if (!string.IsNullOrWhiteSpace(customRole))
                        {
                            identity.AddClaim(new Claim(ClaimTypes.Role, customRole));
                        }
                    }

                    var hasNameId = identity.HasClaim(c => c.Type == ClaimTypes.NameIdentifier);
                    if (!hasNameId)
                    {
                        var customUserId = identity.FindFirst("userId")?.Value;
                        if (!string.IsNullOrWhiteSpace(customUserId))
                        {
                            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, customUserId));
                        }
                    }
                }

                return Task.CompletedTask;
            },
            OnChallenge = async ctx =>
            {
                var logger = ctx.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("Admin.JwtDebug");

                logger.LogWarning(
                    "JWT challenge triggered. Path: {Path}. Error: {Error}. Description: {ErrorDescription}",
                    ctx.Request.Path,
                    ctx.Error,
                    ctx.ErrorDescription);

                ctx.HandleResponse();
                ctx.Response.StatusCode = 401;
                ctx.Response.ContentType = "application/json";
                await ctx.Response.WriteAsync(
                    """{"success":false,"message":"Authentication required."}""");
            },
            OnForbidden = async ctx =>
            {
                var logger = ctx.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("Admin.JwtDebug");

                logger.LogWarning(
                    "JWT forbidden triggered. Path: {Path}. Authenticated user lacks Admin role.",
                    ctx.Request.Path);

                ctx.Response.StatusCode = 403;
                ctx.Response.ContentType = "application/json";
                await ctx.Response.WriteAsync(
                    """{"success":false,"message":"Admin access required."}""");
            }
            // TEMP DEBUG END
        };
    });

builder.Services.AddAuthorization();

// ══════════════════════════════════════════════════════════════════════════
// 5. SWAGGER
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CapShop – Admin Service",
        Version = "v1",
        Description = "Product management, order status, dashboard KPIs and reports. Admin role required."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste Admin JWT token here."
    });

    options.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecuritySchemeReference("Bearer"),
                    new List<string>()
                }
            });
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
// 7. HEALTH CHECKS
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddHealthChecks();

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
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CapShop Admin Service v1");
        c.RoutePrefix = string.Empty;
    });
}

if (!isContainerEnvironment)
    app.UseHttpsRedirection();

app.UseCors("GatewayOnly");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK ENDPOINT (public, no auth required)
// ══════════════════════════════════════════════════════════════════════════
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var response = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description
            })
        };
        await context.Response.WriteAsJsonAsync(response);
    }
}).AllowAnonymous();

if (isContainerEnvironment)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AdminDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();
