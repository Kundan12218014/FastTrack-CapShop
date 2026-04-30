using System;
using System.Linq;
using CapShop.AuthService.Domain.Entities;
using CapShop.AuthService.Infrastructure.Persistence;

namespace CapShop.DataSeeder
{
    public static class UserSeeder
    {
        // Seed users by email — idempotent: only inserts users that don't already exist.
        public static void Seed(AuthDbContext context)
        {
            Console.WriteLine("Seeding Users...");

            var existingEmails = context.Set<User>()
                .Select(u => u.Email)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            int added = 0;

            // ── Admin ──────────────────────────────────────────────────────────
            var adminEmail = "admin@capshop.com";
            if (!existingEmails.Contains(adminEmail))
            {
                var hash = BCrypt.Net.BCrypt.HashPassword("Admin@1234", 12);
                var admin = User.Create("CapShop Admin", adminEmail, "9000000000", hash, UserRoles.Admin);
                context.Set<User>().Add(admin);
                added++;
            }

            // ── Demo customers ─────────────────────────────────────────────────
            var customerHash = BCrypt.Net.BCrypt.HashPassword("Password1!", 12);
            var customersData = new[]
            {
                ("Priya Patel",    "priya.patel@gmail.com",     "9876543201"),
                ("Arjun Mehta",    "arjun.mehta@yahoo.com",     "9876543202"),
                ("Sunita Reddy",   "sunita.reddy@hotmail.com",  "9876543203"),
                ("Vikram Singh",   "vikram.singh@gmail.com",    "9876543204"),
                ("Kavitha Nair",   "kavitha.nair@gmail.com",    "9876543205"),
                ("Rohit Gupta",    "rohit.gupta@outlook.com",   "9876543206"),
                ("Ananya Iyer",    "ananya.iyer@gmail.com",     "9876543207"),
                ("Suresh Kumar",   "suresh.kumar@gmail.com",    "9876543208"),
                ("Deepika Pillai", "deepika.pillai@gmail.com",  "9876543209"),
                ("Manish Joshi",   "manish.joshi@gmail.com",    "9876543210")
            };

            foreach (var (name, email, phone) in customersData)
            {
                if (!existingEmails.Contains(email))
                {
                    var customer = User.Create(name, email, phone, customerHash, UserRoles.Customer);
                    context.Set<User>().Add(customer);
                    added++;
                }
            }

            if (added > 0)
            {
                context.SaveChanges();
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"Seeded {added} new users.");
                Console.ResetColor();
            }
            else
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("All seed users already exist. Skipping.");
                Console.ResetColor();
            }
        }
    }
}
