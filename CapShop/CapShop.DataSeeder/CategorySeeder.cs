using System;
using System.Linq;
using CapShop.CatalogService.Domain.Entities;
using CapShop.CatalogService.Infrastructure.Persistence;

namespace CapShop.DataSeeder
{
    public static class CategorySeeder
    {
        public static void Seed(CatalogDbContext context)
        {
            Console.WriteLine("Seeding Categories...");
            if (context.Set<Category>().Any())
            {
                var originalColor = Console.ForegroundColor;
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("Categories already seeded. Skipping.");
                Console.ForegroundColor = originalColor;
                return;
            }

            var categories = new[]
            {
                Category.Create("Mobiles", "Smartphones, feature phones, accessories", 1),
                Category.Create("Laptops", "Work laptops, gaming laptops, ultrabooks", 2),
                Category.Create("Fashion", "Men and women clothing, ethnic wear, casuals", 3),
                Category.Create("Home & Kitchen", "Appliances, cookware, furniture, decor", 4),
                Category.Create("Books", "Fiction, non-fiction, textbooks, competitive", 5),
                Category.Create("Sports", "Cricket, badminton, fitness, cycling", 6),
                Category.Create("Electronics", "TVs, audio, cameras, smart devices", 7),
                Category.Create("Beauty", "Skincare, haircare, grooming, fragrances", 8)
            };

            context.Set<Category>().AddRange(categories);
            context.SaveChanges();

            var greenColor = Console.ForegroundColor;
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine($"Successfully seeded {categories.Length} categories.");
            Console.ForegroundColor = greenColor;
        }
    }
}
