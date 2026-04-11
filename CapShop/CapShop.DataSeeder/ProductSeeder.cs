using System;
using System.Linq;
using CapShop.CatalogService.Domain.Entities;
using CapShop.CatalogService.Infrastructure.Persistence;

namespace CapShop.DataSeeder
{
    public static class ProductSeeder
    {
        public static void Seed(CatalogDbContext context)
        {
            Console.WriteLine("Seeding Products...");
            if (context.Set<Product>().Any())
            {
                var originalColor = Console.ForegroundColor;
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("Products already seeded. Skipping.");
                Console.ForegroundColor = originalColor;
                return;
            }

            var categories = context.Set<Category>().ToList();
            if (categories.Count < 8)
            {
                throw new Exception("Categories must be seeded before products.");
            }

            int GetCatId(string name) => categories.First(c => c.Name == name).Id;

            var products = new[]
            {
                // Mobiles
                Product.Create("Samsung Galaxy M34 5G (Midnight Blue, 128GB)", "...", 18999m, 45, GetCatId("Mobiles")),
                Product.Create("Redmi Note 13 Pro+ 5G (Aurora Purple, 256GB)", "...", 29999m, 30, GetCatId("Mobiles")),
                Product.Create("Apple iPhone 15 (Black, 128GB)", "...", 79900m, 20, GetCatId("Mobiles")),
                Product.Create("OnePlus Nord CE 3 Lite 5G (Pastel Lime, 128GB)", "...", 19999m, 55, GetCatId("Mobiles")),
                Product.Create("iQOO Z7 Pro 5G (Graphite Matte, 256GB)", "...", 23999m, 3, GetCatId("Mobiles")), // LOW STOCK

                // Laptops
                Product.Create("HP Pavilion 15 Core i5 12th Gen Laptop", "...", 54990m, 18, GetCatId("Laptops")),
                Product.Create("Lenovo IdeaPad Slim 3 Ryzen 5 (Arctic Grey)", "...", 42999m, 25, GetCatId("Laptops")),
                Product.Create("ASUS TUF Gaming F15 Core i7 RTX 4060", "...", 84990m, 12, GetCatId("Laptops")),
                Product.Create("MacBook Air M2 (Midnight, 256GB)", "...", 114900m, 8, GetCatId("Laptops")),
                Product.Create("Dell Inspiron 15 Core i3 12th Gen (Platinum Silver)", "...", 37990m, 0, GetCatId("Laptops")), // OUT OF STOCK

                // Fashion
                Product.Create("Manyavar Kurta Pajama Set — Navy Blue (XL)", "...", 2499m, 60, GetCatId("Fashion")),
                Product.Create("Biba Women Anarkali Kurta Set — Floral Print (M)", "...", 3299m, 35, GetCatId("Fashion")),
                Product.Create("Levis Mens 511 Slim Fit Jeans — Dark Indigo (32x32)", "...", 3499m, 50, GetCatId("Fashion")),
                Product.Create("Allen Solly Womens Formal Blazer — Charcoal Grey (S)", "...", 4499m, 22, GetCatId("Fashion")),
                Product.Create("Raymond Mens Premium Cotton Shirt — Sky Blue (L)", "...", 1799m, 4, GetCatId("Fashion")), // LOW STOCK

                // Home & Kitchen
                Product.Create("Prestige Iris 750 Watt Mixer Grinder (3 Jars)", "...", 3599m, 40, GetCatId("Home & Kitchen")),
                Product.Create("Butterfly Rapid 2 Litre Stainless Steel Pressure Cooker", "...", 1299m, 65, GetCatId("Home & Kitchen")),
                Product.Create("Bosch 7 Kg 5 Star Fully Automatic Front Load Washing Machine", "...", 34990m, 10, GetCatId("Home & Kitchen")),
                Product.Create("Milton Thermosteel Duo Deluxe 1000 Flip Lid Flask 1L", "...", 799m, 80, GetCatId("Home & Kitchen")),
                Product.Create("Asian Paints Smart Care Damp Proof Exterior Paint 4L", "...", 2199m, 0, GetCatId("Home & Kitchen")), // OUT OF STOCK

                // Books
                Product.Create("The Guide — R.K. Narayan (Penguin Modern Classics)", "...", 299m, 100, GetCatId("Books")),
                Product.Create("Wings of Fire — A.P.J. Abdul Kalam (Universities Press)", "...", 199m, 120, GetCatId("Books")),
                Product.Create("Ikigai The Japanese Secret to a Long Happy Life (Hindi)", "...", 349m, 85, GetCatId("Books")),
                Product.Create("NCERT Mathematics Class 12 Part 1 and 2 (2024 Edition)", "...", 450m, 200, GetCatId("Books")),
                Product.Create("Atomic Habits — James Clear (Penguin Random House India)", "...", 499m, 75, GetCatId("Books")),

                // Sports
                Product.Create("SS Ton Elite Cricket Bat English Willow Grade 3 SH", "...", 3499m, 28, GetCatId("Sports")),
                Product.Create("Yonex Astrox 88S Pro Badminton Racket", "...", 6999m, 15, GetCatId("Sports")),
                Product.Create("Cosco Torino 100% Rubber Football Size 5", "...", 749m, 2, GetCatId("Sports")), // LOW STOCK
                Product.Create("Lifelong LLM27 Multi-Purpose Yoga Mat 6mm Purple", "...", 599m, 90, GetCatId("Sports")),
                Product.Create("Hero Sprint Pro 26T Mountain Cycle Matte Black 18 Speed", "...", 12999m, 7, GetCatId("Sports")),

                // Electronics
                Product.Create("Sony Bravia 55-inch 4K Ultra HD Smart Google TV", "...", 62990m, 9, GetCatId("Electronics")),
                Product.Create("boAt Airdopes 141 TWS Earbuds with 42H Playtime", "...", 1299m, 150, GetCatId("Electronics")),
                Product.Create("Canon PIXMA G3010 All-In-One Ink Tank Colour Printer", "...", 14990m, 16, GetCatId("Electronics")),
                Product.Create("Zebronics Zeb-Delight Pro 2.1 Multimedia Speaker 60W", "...", 3499m, 35, GetCatId("Electronics")),
                Product.Create("Wipro Garnet 9W LED Smart Bulb B22 Voice Control Pack of 2", "...", 799m, 200, GetCatId("Electronics")),

                // Beauty
                Product.Create("Himalaya Herbals Anti-Dandruff Hair Cream 100ml Pack of 3", "...", 549m, 110, GetCatId("Beauty")),
                Product.Create("Lakme Sun Expert SPF 50 PA+++ Tinted Sunscreen 100ml", "...", 399m, 75, GetCatId("Beauty")),
                Product.Create("Forest Essentials Facial Toner Kewra and Nagkesar 200ml", "...", 1895m, 30, GetCatId("Beauty")),
                Product.Create("Biotique Bio Papaya Revitalizing Tan-Removal Scrub 75g", "...", 149m, 95, GetCatId("Beauty")),
                Product.Create("Man Arden 7X Shaving Gel with Vitamin E 200ml", "...", 299m, 3, GetCatId("Beauty")) // LOW STOCK
            };

            context.Set<Product>().AddRange(products);
            context.SaveChanges();

            var greenColor = Console.ForegroundColor;
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine($"Successfully seeded {products.Length} products.");
            Console.ForegroundColor = greenColor;
        }
    }
}
