using System;
using System.Collections.Generic;
using System.Linq;
using CapShop.CatalogService.Domain.Entities;
using CapShop.CatalogService.Infrastructure.Persistence;

namespace CapShop.DataSeeder
{
    public static class CategorySeeder
    {
        public static void Seed(CatalogDbContext context)
        {
            var existingCategories = context.Set<Category>().ToList();
            if (existingCategories.Count >= 8)
            {
                var originalColor = Console.ForegroundColor;
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("All 8 categories already exist. Skipping.");
                Console.ForegroundColor = originalColor;
                return;
            }

            var categoryNames = new[] { "Mobiles", "Laptops", "Fashion", "Home & Kitchen", "Books", "Sports", "Electronics", "Beauty" };
            var categoriesToAdd = new List<Category>();

            // Only add what is missing
            if (!existingCategories.Any(c => c.Name == "Mobiles")) categoriesToAdd.Add(Category.Create("Mobiles", "Smartphones, feature phones, accessories", 1));
            if (!existingCategories.Any(c => c.Name == "Laptops")) categoriesToAdd.Add(Category.Create("Laptops", "Work laptops, gaming laptops, ultrabooks", 2));
            if (!existingCategories.Any(c => c.Name == "Fashion")) categoriesToAdd.Add(Category.Create("Fashion", "Men and women clothing, ethnic wear, casuals", 3));
            if (!existingCategories.Any(c => c.Name == "Home & Kitchen")) categoriesToAdd.Add(Category.Create("Home & Kitchen", "Appliances, cookware, furniture, decor", 4));
            if (!existingCategories.Any(c => c.Name == "Books")) categoriesToAdd.Add(Category.Create("Books", "Fiction, non-fiction, textbooks, competitive", 5));
            if (!existingCategories.Any(c => c.Name == "Sports")) categoriesToAdd.Add(Category.Create("Sports", "Cricket, badminton, fitness, cycling", 6));
            if (!existingCategories.Any(c => c.Name == "Electronics")) categoriesToAdd.Add(Category.Create("Electronics", "TVs, audio, cameras, smart devices", 7));
            if (!existingCategories.Any(c => c.Name == "Beauty")) categoriesToAdd.Add(Category.Create("Beauty", "Skincare, haircare, grooming, fragrances", 8));

            if (categoriesToAdd.Any())
            {
                context.Set<Category>().AddRange(categoriesToAdd);
                context.SaveChanges();
                
                var greenColor = Console.ForegroundColor;
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"Successfully seeded {categoriesToAdd.Count} missing categories.");
                Console.ForegroundColor = greenColor;
            }
        }
    }
}
