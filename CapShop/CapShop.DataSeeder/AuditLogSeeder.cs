using System;
using System.Linq;
using CapShop.AdminService.Domain.Entities;
using CapShop.AdminService.Infrastructure.Persistence;
using CapShop.AuthService.Domain.Entities;
using CapShop.AuthService.Infrastructure.Persistence;

namespace CapShop.DataSeeder
{
    public static class AuditLogSeeder
    {
        public static void Seed(AdminDbContext adminContext, AuthDbContext authContext)
        {
            Console.WriteLine("Seeding Audit Logs...");
            if (adminContext.Set<AuditLog>().Any())
            {
                var originalColor = Console.ForegroundColor;
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("Audit logs already seeded. Skipping.");
                Console.ForegroundColor = originalColor;
                return;
            }

            var adminUser = authContext.Set<User>().FirstOrDefault(u => u.Role == UserRoles.Admin);
            if (adminUser == null)
            {
                throw new Exception("Admin user must be seeded before audit logs.");
            }

            string adminId = adminUser.Id.ToString();

            var logs = new[]
            {
                AuditLog.Create(adminId, "CREATE", "Product", "prod-1", "Created new product Samsung Galaxy M34"),
                AuditLog.Create(adminId, "UPDATE_STOCK", "Product", "prod-1", "Updated stock from 0 to 45"),
                AuditLog.Create(adminId, "CREATE", "Product", "prod-2", "Created new product Redmi Note 13"),
                AuditLog.Create(adminId, "UPDATE_ORDER_STATUS", "Order", "ord-1", "Updated order status to Shipped"),
                AuditLog.Create(adminId, "UPDATE_ORDER_STATUS", "Order", "ord-2", "Updated order status to Delivered"),
                AuditLog.Create(adminId, "DEACTIVATE", "Product", "prod-3", "Deactivated out of season product"),
                AuditLog.Create(adminId, "UPDATE_PRICE", "Product", "prod-4", "Changed price for promotional offer"),
                AuditLog.Create(adminId, "CREATE", "Category", "cat-1", "Created Electronics category"),
                AuditLog.Create(adminId, "UPDATE_ORDER_STATUS", "Order", "ord-3", "Updated order status to Packed"),
                AuditLog.Create(adminId, "CREATE", "Product", "prod-5", "Added new Macbook Air M2"),
                AuditLog.Create(adminId, "UPDATE_STOCK", "Product", "prod-5", "Stock adjustment for Macbook Air M2"),
                AuditLog.Create(adminId, "UPDATE_ORDER_STATUS", "Order", "ord-4", "Updated order status to Shipped"),
                AuditLog.Create(adminId, "DEACTIVATE", "Product", "prod-10", "Deactivated obsolete laptop"),
                AuditLog.Create(adminId, "UPDATE_PRICE", "Product", "prod-11", "Price drop for festive season"),
                AuditLog.Create(adminId, "CREATE", "Product", "prod-20", "Added new Harry Potter book set")
            };

            // Spread timestamps
            var baseDate = new DateTime(2024, 1, 15, 10, 0, 0, DateTimeKind.Utc);
            for (int i = 0; i < logs.Length; i++)
            {
                // Reflect into the private/protected setter if necessary, or just rely on EF not caring if we don't set it 
                // but we need realistic timestamps. I'll use reflection because the setter is private.
                typeof(AuditLog).GetProperty("PerformedAt")?.SetValue(logs[i], baseDate.AddDays(i * 5));
            }

            adminContext.Set<AuditLog>().AddRange(logs);
            adminContext.SaveChanges();

            var greenColor = Console.ForegroundColor;
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine($"Successfully seeded {logs.Length} audit logs.");
            Console.ForegroundColor = greenColor;
        }
    }
}
