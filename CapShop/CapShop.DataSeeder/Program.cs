using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using CapShop.AuthService.Infrastructure.Persistence;
using CapShop.CatalogService.Infrastructure.Persistence;
using CapShop.OrderService.Infrastructure.Persistence;
using CapShop.AdminService.Infrastructure.Persistence;

namespace CapShop.DataSeeder
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                Console.WriteLine("[DataSeeder] Loading configuration...");

                // Respect ASPNETCORE_ENVIRONMENT so appsettings.Development.json
                // is picked up automatically when running locally.
                var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";

                var configuration = new ConfigurationBuilder()
                    .SetBasePath(System.IO.Directory.GetCurrentDirectory())
                    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                    .AddJsonFile($"appsettings.{env}.json", optional: true, reloadOnChange: true)
                    .AddEnvironmentVariables()   // Docker overrides from docker-compose
                    .Build();

                var authConnectionString    = configuration.GetConnectionString("AuthConnection");
                var catalogConnectionString = configuration.GetConnectionString("CatalogConnection");
                var orderConnectionString   = configuration.GetConnectionString("OrderConnection");
                var adminConnectionString   = configuration.GetConnectionString("AdminConnection");

                Console.WriteLine($"[DataSeeder] Environment: {env}");
                Console.WriteLine("[DataSeeder] Connecting to databases...");

                var authOptions = new DbContextOptionsBuilder<AuthDbContext>()
                    .UseSqlServer(authConnectionString).Options;
                var catalogOptions = new DbContextOptionsBuilder<CatalogDbContext>()
                    .UseSqlServer(catalogConnectionString).Options;
                var orderOptions = new DbContextOptionsBuilder<OrderDbContext>()
                    .UseSqlServer(orderConnectionString).Options;
                var adminOptions = new DbContextOptionsBuilder<AdminDbContext>()
                    .UseSqlServer(adminConnectionString).Options;

                using var authContext    = new AuthDbContext(authOptions);
                using var catalogContext = new CatalogDbContext(catalogOptions);
                using var orderContext   = new OrderDbContext(orderOptions);
                using var adminContext   = new AdminDbContext(adminOptions);

                Console.WriteLine("[DataSeeder] Starting seed...");
                SeedOrchestrator.SeedAll(authContext, catalogContext, orderContext, adminContext);
                Console.WriteLine("[DataSeeder] Seed completed successfully!");
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                if (ex.InnerException != null && ex.InnerException.Message.Contains("Invalid object name"))
                {
                    Console.WriteLine("[DataSeeder] ERROR: Tables not found. Run migrations first.");
                }
                else
                {
                    Console.WriteLine($"[DataSeeder] ERROR: {ex.Message}");
                    Console.WriteLine(ex.StackTrace);
                }
                Console.ResetColor();
                Environment.Exit(1);
            }
        }
    }
}
