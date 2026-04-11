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
                    .Build();

                var authConnectionString = configuration.GetConnectionString("AuthConnection");
                var catalogConnectionString = configuration.GetConnectionString("CatalogConnection");
                var orderConnectionString = configuration.GetConnectionString("OrderConnection");
                var adminConnectionString = configuration.GetConnectionString("AdminConnection");

                var authOptions = new DbContextOptionsBuilder<AuthDbContext>()
                    .UseSqlServer(authConnectionString)
                    .Options;
                var catalogOptions = new DbContextOptionsBuilder<CatalogDbContext>()
                    .UseSqlServer(catalogConnectionString)
                    .Options;
                var orderOptions = new DbContextOptionsBuilder<OrderDbContext>()
                    .UseSqlServer(orderConnectionString)
                    .Options;
                var adminOptions = new DbContextOptionsBuilder<AdminDbContext>()
                    .UseSqlServer(adminConnectionString)
                    .Options;

                using var authContext = new AuthDbContext(authOptions);
                using var catalogContext = new CatalogDbContext(catalogOptions);
                using var orderContext = new OrderDbContext(orderOptions);
                using var adminContext = new AdminDbContext(adminOptions);

                Console.WriteLine("Starting CapShop Data Seed...");

                SeedOrchestrator.SeedAll(authContext, catalogContext, orderContext, adminContext);

                Console.WriteLine("Seed completed successfully!");
            }
            catch (Exception ex)
            {
                var originalColor = Console.ForegroundColor;
                Console.ForegroundColor = ConsoleColor.Red;
                if (ex.InnerException != null && ex.InnerException.Message.Contains("Invalid object name"))
                {
                    Console.WriteLine("ERROR: Database tables not found. Please run migrations first:");
                    Console.WriteLine("  cd backend/Services/AuthService/CapShop.AuthService && dotnet ef database update");
                    Console.WriteLine("  cd backend/Services/CatalogService/CapShop.CatalogService && dotnet ef database update");
                    Console.WriteLine("  cd backend/Services/OrderService/CapShop.OrderService && dotnet ef database update");
                    Console.WriteLine("  cd backend/Services/AdminService/CapShop.AdminService && dotnet ef database update");
                }
                else
                {
                    Console.WriteLine($"ERROR: {ex.Message}");
                    Console.WriteLine(ex.StackTrace);
                }
                Console.ForegroundColor = originalColor;
            }
        }
    }
}
