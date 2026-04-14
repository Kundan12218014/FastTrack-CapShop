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
                Console.WriteLine("Loading configuration...");
                var configuration = new ConfigurationBuilder()
                    .SetBasePath(System.IO.Directory.GetCurrentDirectory())
                    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                    .AddEnvironmentVariables()   // ← Docker overrides from docker-compose
                    .Build();

                var authConnectionString    = configuration.GetConnectionString("AuthConnection");
                var catalogConnectionString = configuration.GetConnectionString("CatalogConnection");
                var orderConnectionString   = configuration.GetConnectionString("OrderConnection");
                var adminConnectionString   = configuration.GetConnectionString("AdminConnection");

                Console.WriteLine("Connecting to databases...");

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

                // Wait briefly for EF to be sure migrations are applied
                Console.WriteLine("Waiting for database migrations to complete...");
                System.Threading.Thread.Sleep(10000);

                Console.WriteLine("Starting CapShop Data Seed...");
                SeedOrchestrator.SeedAll(authContext, catalogContext, orderContext, adminContext);
                Console.WriteLine("✅ Seed completed successfully!");
            }
            catch (Exception ex)
            {
                var originalColor = Console.ForegroundColor;
                Console.ForegroundColor = ConsoleColor.Red;
                if (ex.InnerException != null && ex.InnerException.Message.Contains("Invalid object name"))
                {
                    Console.WriteLine("ERROR: Database tables not found. Migrations may not have run yet.");
                    Console.WriteLine("The microservices apply migrations on startup — retry after they are healthy.");
                }
                else
                {
                    Console.WriteLine($"ERROR: {ex.Message}");
                    Console.WriteLine(ex.StackTrace);
                }
                Console.ForegroundColor = originalColor;
                Environment.Exit(1);
            }
        }
    }
}
