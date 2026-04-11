using System;
using System.Linq;
using CapShop.AuthService.Infrastructure.Persistence;
using CapShop.CatalogService.Infrastructure.Persistence;
using CapShop.OrderService.Infrastructure.Persistence;
using CapShop.AdminService.Infrastructure.Persistence;
using CapShop.AuthService.Domain.Entities;
using CapShop.CatalogService.Domain.Entities;
using CapShop.OrderService.Domain.Entities;
using CapShop.AdminService.Domain.Entities;
using CapShop.OrderService.Domain.Enums;

namespace CapShop.DataSeeder
{
    public static class SeedOrchestrator
    {
        public static void SeedAll(
            AuthDbContext authContext, 
            CatalogDbContext catalogContext, 
            OrderDbContext orderContext, 
            AdminDbContext adminContext)
        {
            Console.WriteLine("Applying migrations if needed...");
            // Optional: could do context.Database.EnsureCreated() or just let the user run migrations first as per instructions.
            // The instructions say "If EF Core migrations have not been run yet, print: ERROR: Database tables not found."
            // This is already checked in Program.cs catch block.

            Console.WriteLine("Running seeders in sequence...");
            
            try 
            {
                UserSeeder.Seed(authContext);
                CategorySeeder.Seed(catalogContext);
                ProductSeeder.Seed(catalogContext);
                OrderSeeder.Seed(authContext, catalogContext, orderContext);
                AuditLogSeeder.Seed(adminContext, authContext);
                
                PrintSummary(authContext, catalogContext, orderContext, adminContext);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private static void PrintSummary(
            AuthDbContext authContext, 
            CatalogDbContext catalogContext, 
            OrderDbContext orderContext, 
            AdminDbContext adminContext)
        {
            var users = authContext.Set<User>().ToList();
            var categoriesCount = catalogContext.Set<Category>().Count();
            var products = catalogContext.Set<Product>().ToList();
            var orders = orderContext.Set<Order>().ToList();
            var auditLogsCount = adminContext.Set<AuditLog>().Count();

            int adminCount = users.Count(u => u.Role == UserRoles.Admin);
            int customerCount = users.Count(u => u.Role == UserRoles.Customer);

            int outOfStockCount = products.Count(p => p.StockQuantity == 0);
            int lowStockCount = products.Count(p => p.StockQuantity > 0 && p.StockQuantity <= 5);

            int deliveredCount = orders.Count(o => o.Status == OrderStatus.Delivered);
            int shippedCount = orders.Count(o => o.Status == OrderStatus.Shipped);
            int packedCount = orders.Count(o => o.Status == OrderStatus.Packed);
            int paidCount = orders.Count(o => o.Status == OrderStatus.Paid);
            int cancelledCount = orders.Count(o => o.Status == OrderStatus.Cancelled);
            
            // Re-fetch orders with items and history for counts
            int orderItemsCount = orderContext.Set<Order>().SelectMany(o => o.Items).Count();
            int statusHistoryCount = orderContext.Set<Order>().SelectMany(o => o.History).Count();

            Console.WriteLine();
            Console.WriteLine("=== CAPSHOP SEED COMPLETE ===");
            Console.WriteLine($"Users:       {users.Count} ({adminCount} Admin + {customerCount} Customers)");
            Console.WriteLine($"Categories:   {categoriesCount}");
            Console.WriteLine($"Products:    {products.Count} ({outOfStockCount} out of stock, {lowStockCount} low stock)");
            Console.WriteLine($"Orders:      {orders.Count} ({deliveredCount} delivered, {shippedCount} shipped, {packedCount} packed, {paidCount} paid, {cancelledCount} cancelled)");
            Console.WriteLine($"Order Items: {orderItemsCount}");
            Console.WriteLine($"Status History: {statusHistoryCount}");
            Console.WriteLine($"Audit Logs:  {auditLogsCount}");
            
            Console.WriteLine();
            Console.WriteLine("LOGIN CREDENTIALS:");
            Console.WriteLine("Admin:    admin@capshop.com     / Admin@1234");
            Console.WriteLine("Customer: priya.patel@gmail.com / Password1!");
            Console.WriteLine("(All 10 customers use Password1!)");
            Console.WriteLine();
        }
    }
}
