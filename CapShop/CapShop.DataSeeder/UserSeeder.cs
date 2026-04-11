// UserSeeder.cs
using System;
using System.Linq;
using CapShop.AuthService.Domain.Entities;
using CapShop.AuthService.Infrastructure.Persistence;

namespace CapShop.DataSeeder
{
    public static class UserSeeder
    {
        public static void Seed(AuthDbContext context)
        {
            Console.WriteLine("Seeding Users...");
            if (context.Set<User>().Any())
            {
                var originalColor = Console.ForegroundColor;
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("Users already seeded. Skipping.");
                Console.ForegroundColor = originalColor;
                return;
            }

            var adminPasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234", 12);
            var customerPasswordHash = BCrypt.Net.BCrypt.HashPassword("Password1!", 12);

            var admin = User.Create("Rajesh Sharma", "admin@capshop.com", "9000000001", adminPasswordHash, UserRoles.Admin);
            context.Set<User>().Add(admin);

            var customersData = new[]
            {
                ("Priya Patel", "priya.patel@gmail.com", "9876543201"),
                ("Arjun Mehta", "arjun.mehta@yahoo.com", "9876543202"),
                ("Sunita Reddy", "sunita.reddy@hotmail.com", "9876543203"),
                ("Vikram Singh", "vikram.singh@gmail.com", "9876543204"),
                ("Kavitha Nair", "kavitha.nair@gmail.com", "9876543205"),
                ("Rohit Gupta", "rohit.gupta@outlook.com", "9876543206"),
                ("Ananya Iyer", "ananya.iyer@gmail.com", "9876543207"),
                ("Suresh Kumar", "suresh.kumar@gmail.com", "9876543208"),
                ("Deepika Pillai", "deepika.pillai@gmail.com", "9876543209"),
                ("Manish Joshi", "manish.joshi@gmail.com", "9876543210")
            };

            foreach (var c in customersData)
            {
                var customer = User.Create(c.Item1, c.Item2, c.Item3, customerPasswordHash, UserRoles.Customer);
                context.Set<User>().Add(customer);
            }

            context.SaveChanges();
            
            var greenColor = Console.ForegroundColor;
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("Successfully seeded 11 users.");
            Console.ForegroundColor = greenColor;
        }
    }
}
