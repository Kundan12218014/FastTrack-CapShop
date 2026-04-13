using CapShop.NotificationService.Application.Messaging;
using CapShop.NotificationService.Infrastructure.Persistence;
using CapShop.NotificationService.Infrastructure.Services;
using CapShop.Shared.Configuration;
using CapShop.Shared.Messaging;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Database
var conStr = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<NotificationDbContext>(options =>
    options.UseSqlServer(conStr, sqlOptions =>
    {
      sqlOptions.EnableRetryOnFailure(maxRetryCount: 3);
    }));

// RabbitMQ
builder.Services.Configure<RabbitMqOptions>(builder.Configuration.GetSection("RabbitMq"));
builder.Services.AddSingleton<OrderEmailService>();
builder.Services.AddHostedService<OrderPlacedConsumer>();

// Security
builder.Services.AddAuthentication(options =>
{
  options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
  options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
  var jwtSettings = builder.Configuration.GetSection("JwtSettings");
  var secretKey = jwtSettings["SecretKey"]
      ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured.");
  options.TokenValidationParameters = new TokenValidationParameters
  {
    ValidateIssuer = true,
    ValidateAudience = true,
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    ValidIssuer = jwtSettings["Issuer"],
    ValidAudience = jwtSettings["Audience"],
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
  };
});

builder.Services.AddCors(options =>
{
  options.AddPolicy("AllowAll",
      policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var appInstance = builder.Build();

appInstance.UseCors("AllowAll");

using (var scope = appInstance.Services.CreateScope())
{
  var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
  db.Database.Migrate();
}

appInstance.UseSwagger();
appInstance.UseSwaggerUI();

appInstance.UseAuthentication();
appInstance.UseAuthorization();
appInstance.MapControllers();

appInstance.Run();
