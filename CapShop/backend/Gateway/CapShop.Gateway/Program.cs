using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ══════════════════════════════════════════════════════════════════════════
// 1. LOAD ocelot.json alongside appsettings.json
//
// AddJsonFile order matters — ocelot.json is merged into the configuration
// after appsettings.json so its keys do not clash with app settings.
// The environment override file (ocelot.Development.json) is optional —
// useful later if you want different ports per environment.
// ══════════════════════════════════════════════════════════════════════════
builder.Configuration
    .AddJsonFile("ocelot.json", optional: false, reloadOnChange: true)
    .AddJsonFile(
        $"ocelot.{builder.Environment.EnvironmentName}.json",
        optional: true,
        reloadOnChange: true);

// ══════════════════════════════════════════════════════════════════════════
// 2. JWT VALIDATION AT THE GATEWAY LEVEL
//
// Routes that have "AuthenticationOptions.AuthenticationProviderKey": "Bearer"
// in ocelot.json are validated HERE before the request is forwarded.
//
// Routes WITHOUT AuthenticationOptions (auth signup/login, catalog reads)
// are forwarded directly — no token required.
//
// CRITICAL: The provider key name "Bearer" must exactly match
// AuthenticationProviderKey in ocelot.json.
//
// CRITICAL: SecretKey, Issuer, Audience must exactly match
// what CapShop.AuthService uses to GENERATE tokens.
// If they differ, every protected request returns 401.
// ══════════════════════════════════════════════════════════════════════════
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]
    ?? throw new InvalidOperationException(
        "JwtSettings:SecretKey is not configured in the Gateway appsettings.json.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer("Bearer", options =>
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
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        // Return clean JSON 401 — not an HTML redirect page
        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    """{"success":false,"message":"Authentication required. Please login to get a token."}""");
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    """{"success":false,"message":"You do not have permission to access this resource."}""");
            }
        };
    });

// ══════════════════════════════════════════════════════════════════════════
// 3. CORS
//
// The React Vite dev server (port 5173) sends requests to the gateway
// (port 5000). Without CORS, every browser request is blocked.
//
// AllowCredentials() is needed if you later add cookie-based auth.
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddCors(options =>
    options.AddPolicy("ReactApp", policy =>
        policy
            .WithOrigins(
                "http://localhost:5173",   // Vite dev server
                "https://localhost:5173")  // Vite dev server (HTTPS)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()));

// ══════════════════════════════════════════════════════════════════════════
// 4. OCELOT
//
// AddOcelot() registers all Ocelot internals — route matching, load
// balancing, request aggregation, and the middleware pipeline builder.
// ══════════════════════════════════════════════════════════════════════════
builder.Services.AddOcelot(builder.Configuration);

// ══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE PIPELINE
//
// Order is critical:
//   UseCors            — must be before UseAuthentication
//   UseAuthentication  — validates JWT for protected Ocelot routes
//   UseAuthorization   — enforces [Authorize] policies
//   UseOcelot          — MUST be last — handles all routing and forwarding
//                        It replaces UseRouting + UseEndpoints entirely.
//                        Nothing registered after UseOcelot() will execute.
// ══════════════════════════════════════════════════════════════════════════
var app = builder.Build();

app.UseCors("ReactApp");
app.UseAuthentication();
app.UseAuthorization();

// UseOcelot() is async and blocks until the app shuts down.
// Always await it — do not fire-and-forget.
await app.UseOcelot();

app.Run();
