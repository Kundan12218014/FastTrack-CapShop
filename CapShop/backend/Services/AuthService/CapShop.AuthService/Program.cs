using CapShop.AuthService.Application.Commands;
using CapShop.AuthService.Application.DTOs;
using CapShop.AuthService.Application.Queries;
using CapShop.AuthService.Application.Validators;
using CapShop.AuthService.Domain.Interfaces;
using CapShop.AuthService.Infrastructure.Persistence;
using CapShop.AuthService.Infrastructure.Persistence.Repositories;
using CapShop.AuthService.Infrastructure.Security;
using CapShop.Shared.Middleware;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
public partial class Program
{
    private static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Add services to the container.

        //1. Database
        builder.Services.AddDbContext<AuthDbContext>(options =>
        options.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            sql => sql.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null)));
        //2.Dependency injection
        //register by interface = never by concreate class
        //scoped = new instance per HTTP request (correct for EF Core)
        builder.Services.AddScoped<IUserRepository, UserRepository>();
        builder.Services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        //Application layers handlers
        builder.Services.AddScoped<RegisterUserCommandHandler>(); 
        builder.Services.AddScoped<LoginCommandHandler>();
        builder.Services.AddScoped<GetUserQueryHandler>();

        //validation
        builder.Services.AddFluentValidationAutoValidation();
        builder.Services.AddValidatorsFromAssemblyContaining<SignupRequestValidator>();
        //Jwt Authentication
        var jwtSettings = builder.Configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured.");
        builder.Services.AddAuthentication(options =>
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
                  OnChallenge = async context =>
                  {
                      context.HandleResponse();
                      context.Response.StatusCode = 401;
                      context.Response.ContentType = "application/json";
                      await context.Response.WriteAsync("""{"success":false,"message":"Authentication required. please provide a valid token."}""");
                  },
                  OnForbidden = async context =>
                  {
                      context.Response.StatusCode = 403;
                      context.Response.ContentType = "application/json";
                      await context.Response.WriteAsync(
                     """{"success":false,"message":"You do not have permission to perform this action."}""");
                  }
              };

          });
        builder.Services.AddAuthorization();
        builder.Services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();
        });

        //swagger
        // ============================================================
        // SWAGGER (LATEST .NET VERSION)
        // ============================================================

        builder.Services.AddEndpointsApiExplorer();

        builder.Services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "CapShop – Auth Service",
                Version = "v1",
                Description = "Handles registration, login, JWT issuance and role management."
            });

            // JWT Authentication
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Description = "Enter JWT token like: Bearer {token}",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT"
            });

            // Apply JWT to all endpoints
            options.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecuritySchemeReference("Bearer"),
                    new List<string>()
                }
            });
        });
        //cors
        builder.Services.AddCors(options => options.AddPolicy("GatewayOnly", policy =>
                    policy.WithOrigins(
                        "https://localhost:5000",//ocelet gateway
                        "http://localhost:5173")//vite dev server
            .AllowAnyHeader()
            .AllowAnyMethod()));
        builder.Services.AddControllers();
        // ══════════════════════════════════════════════════════════════════════════
        // MIDDLEWARE PIPELINE — ORDER IS CRITICAL
        // ══════════════════════════════════════════════════════════════════════════
        var app = builder.Build();

        // Must be FIRST — catches exceptions from all middleware below it
        app.UseMiddleware<GlobalExceptionMiddleware>();
        app.UseMiddleware<CorrelationIdMiddleware>();

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "CapShop Auth Service v1");
                c.RoutePrefix = string.Empty; // Swagger UI at root: https://localhost:5001
            });
        }

        app.UseHttpsRedirection();
        app.UseCors("GatewayOnly");
        app.UseAuthentication(); // Must come before UseAuthorization
        app.UseAuthorization();
        app.MapControllers();

        // ══════════════════════════════════════════════════════════════════════════
        // AUTO-APPLY MIGRATIONS ON STARTUP (Development only)
        // In production, run migrations as a separate CI/CD step — not on startup.
        // ══════════════════════════════════════════════════════════════════════════
        if (app.Environment.IsDevelopment())
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
            await db.Database.MigrateAsync();
        }
        if (!app.Environment.IsDevelopment())
        {
            app.UseHttpsRedirection();
        }
        app.Run();
    }
}