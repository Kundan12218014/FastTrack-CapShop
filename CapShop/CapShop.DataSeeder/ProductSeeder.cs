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
                throw new Exception("Categories must be seeded before products.");

            int GetCatId(string name) => categories.First(c => c.Name == name).Id;

            var products = new[]
            {
                // ── Mobiles ─────────────────────────────────────────────────────
                Product.Create(
                    "Samsung Galaxy M34 5G (Midnight Blue, 128GB)",
                    "6.5-inch Super AMOLED display, 50MP triple camera, 6000mAh battery, Android 13.",
                    18999m, 45, GetCatId("Mobiles"),
                    "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80"),

                Product.Create(
                    "Redmi Note 13 Pro+ 5G (Aurora Purple, 256GB)",
                    "6.67-inch AMOLED, 200MP camera, 120W HyperCharge, IP68 rated.",
                    29999m, 30, GetCatId("Mobiles"),
                    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80"),

                Product.Create(
                    "Apple iPhone 15 (Black, 128GB)",
                    "A16 Bionic chip, 48MP main camera, Dynamic Island, USB-C charging.",
                    79900m, 20, GetCatId("Mobiles"),
                    "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80"),

                Product.Create(
                    "OnePlus Nord CE 3 Lite 5G (Pastel Lime, 128GB)",
                    "6.72-inch LCD display, Snapdragon 695, 108MP camera, 67W SUPERVOOC.",
                    19999m, 55, GetCatId("Mobiles"),
                    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80"),

                Product.Create(
                    "iQOO Z7 Pro 5G (Graphite Matte, 256GB)",
                    "6.78-inch AMOLED, MediaTek Dimensity 7200, 64MP OIS camera, 66W charging.",
                    23999m, 3, GetCatId("Mobiles"),
                    "https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=600&q=80"),

                // ── Laptops ──────────────────────────────────────────────────────
                Product.Create(
                    "HP Pavilion 15 Core i5 12th Gen Laptop",
                    "15.6-inch FHD IPS, Intel i5-1235U, 16GB RAM, 512GB SSD, Windows 11.",
                    54990m, 18, GetCatId("Laptops"),
                    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80"),

                Product.Create(
                    "Lenovo IdeaPad Slim 3 Ryzen 5 (Arctic Grey)",
                    "15.6-inch FHD, AMD Ryzen 5 7520U, 8GB RAM, 512GB SSD, Office 2021.",
                    42999m, 25, GetCatId("Laptops"),
                    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&q=80"),

                Product.Create(
                    "ASUS TUF Gaming F15 Core i7 RTX 4060",
                    "15.6-inch 144Hz FHD, Intel i7-12700H, 16GB RAM, 512GB SSD, RTX 4060.",
                    84990m, 12, GetCatId("Laptops"),
                    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80"),

                Product.Create(
                    "MacBook Air M2 (Midnight, 256GB)",
                    "13.6-inch Liquid Retina, Apple M2 chip, 8GB RAM, 256GB SSD, 18hr battery.",
                    114900m, 8, GetCatId("Laptops"),
                    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80"),

                Product.Create(
                    "Dell Inspiron 15 Core i3 12th Gen (Platinum Silver)",
                    "15.6-inch FHD, Intel i3-1215U, 8GB RAM, 512GB SSD, Windows 11 Home.",
                    37990m, 0, GetCatId("Laptops"),
                    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80"),

                // ── Fashion ──────────────────────────────────────────────────────
                Product.Create(
                    "Manyavar Kurta Pajama Set — Navy Blue (XL)",
                    "Premium cotton blend, traditional Indian weave, machine washable, festive wear.",
                    2499m, 60, GetCatId("Fashion"),
                    "https://images.unsplash.com/photo-1589810635657-232948472d98?w=600&q=80"),

                Product.Create(
                    "Biba Women Anarkali Kurta Set — Floral Print (M)",
                    "Georgette fabric, three-piece set with dupatta, ethnic floral print.",
                    3299m, 35, GetCatId("Fashion"),
                    "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=80"),

                Product.Create(
                    "Levis Mens 511 Slim Fit Jeans — Dark Indigo (32x32)",
                    "Slim fit through the hip and thigh, slightly tapered leg, stretch denim.",
                    3499m, 50, GetCatId("Fashion"),
                    "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80"),

                Product.Create(
                    "Allen Solly Womens Formal Blazer — Charcoal Grey (S)",
                    "Single-button closure, slim fit, viscose-polyester blend, dry-clean only.",
                    4499m, 22, GetCatId("Fashion"),
                    "https://images.unsplash.com/photo-1594938298603-c8148c4b4fac?w=600&q=80"),

                Product.Create(
                    "Raymond Mens Premium Cotton Shirt — Sky Blue (L)",
                    "100% premium cotton, full sleeves, regular fit, formal occasion wear.",
                    1799m, 4, GetCatId("Fashion"),
                    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80"),

                // ── Home & Kitchen ───────────────────────────────────────────────
                Product.Create(
                    "Prestige Iris 750 Watt Mixer Grinder (3 Jars)",
                    "Nutri-blend with 3 multipurpose jars, stainless steel blades, 5-year warranty.",
                    3599m, 40, GetCatId("Home & Kitchen"),
                    "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80"),

                Product.Create(
                    "Butterfly Rapid 2 Litre Stainless Steel Pressure Cooker",
                    "Inner lid design, ISI marked, suitable for induction and gas stoves.",
                    1299m, 65, GetCatId("Home & Kitchen"),
                    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80"),

                Product.Create(
                    "Bosch 7 Kg 5 Star Fully Automatic Front Load Washing Machine",
                    "EcoSilence motor, Anti-vibration design, 15 wash programs, Speed Perfect.",
                    34990m, 10, GetCatId("Home & Kitchen"),
                    "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=600&q=80"),

                Product.Create(
                    "Milton Thermosteel Duo Deluxe 1000 Flip Lid Flask 1L",
                    "Keeps hot 24 hrs, cold 48 hrs, food-grade stainless steel inner, BPA free.",
                    799m, 80, GetCatId("Home & Kitchen"),
                    "https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=600&q=80"),

                Product.Create(
                    "Asian Paints Smart Care Damp Proof Exterior Paint 4L",
                    "Weather shield formula, anti-algae, 7-year performance guarantee, 4L bucket.",
                    2199m, 0, GetCatId("Home & Kitchen"),
                    "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80"),

                // ── Books ────────────────────────────────────────────────────────
                Product.Create(
                    "The Guide — R.K. Narayan (Penguin Modern Classics)",
                    "Booker Prize-winning masterpiece set in fictional Malgudi, a timeless Indian classic.",
                    299m, 100, GetCatId("Books"),
                    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80"),

                Product.Create(
                    "Wings of Fire — A.P.J. Abdul Kalam (Universities Press)",
                    "Autobiography of India's Missile Man and former President, an inspirational journey.",
                    199m, 120, GetCatId("Books"),
                    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80"),

                Product.Create(
                    "Ikigai The Japanese Secret to a Long Happy Life (Hindi)",
                    "Bestselling guide to finding purpose and joy in everyday life, translated to Hindi.",
                    349m, 85, GetCatId("Books"),
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80"),

                Product.Create(
                    "NCERT Mathematics Class 12 Part 1 and 2 (2024 Edition)",
                    "Official NCERT textbook for Class 12 Maths covering Calculus, Algebra and more.",
                    450m, 200, GetCatId("Books"),
                    "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80"),

                Product.Create(
                    "Atomic Habits — James Clear (Penguin Random House India)",
                    "Proven framework for building good habits and breaking bad ones. #1 New York Times bestseller.",
                    499m, 75, GetCatId("Books"),
                    "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&q=80"),

                // ── Sports ───────────────────────────────────────────────────────
                Product.Create(
                    "SS Ton Elite Cricket Bat English Willow Grade 3 SH",
                    "Premium English Willow Grade 3, short handle, ideal for hard tennis and leather ball.",
                    3499m, 28, GetCatId("Sports"),
                    "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80"),

                Product.Create(
                    "Yonex Astrox 88S Pro Badminton Racket",
                    "Head-heavy balance, rotational generator system, for steep attacking smashes.",
                    6999m, 15, GetCatId("Sports"),
                    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80"),

                Product.Create(
                    "Cosco Torino 100% Rubber Football Size 5",
                    "32-panel hand-sewn construction, ideal for training and recreational play.",
                    749m, 2, GetCatId("Sports"),
                    "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&q=80"),

                Product.Create(
                    "Lifelong LLM27 Multi-Purpose Yoga Mat 6mm Purple",
                    "6mm thick anti-slip yoga mat, sweat-resistant, carry strap included.",
                    599m, 90, GetCatId("Sports"),
                    "https://images.unsplash.com/photo-1601925228008-359e0a35e7e0?w=600&q=80"),

                Product.Create(
                    "Hero Sprint Pro 26T Mountain Cycle Matte Black 18 Speed",
                    "26-inch wheel, 18-speed Shimano gears, front suspension fork, disc brakes.",
                    12999m, 7, GetCatId("Sports"),
                    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"),

                // ── Electronics ──────────────────────────────────────────────────
                Product.Create(
                    "Sony Bravia 55-inch 4K Ultra HD Smart Google TV",
                    "X1 Processor, Dolby Vision & Atmos, Google TV, Chromecast built-in, 2 HDMI.",
                    62990m, 9, GetCatId("Electronics"),
                    "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&q=80"),

                Product.Create(
                    "boAt Airdopes 141 TWS Earbuds with 42H Playtime",
                    "10mm drivers, IPX4 splash resistance, Beast Mode low latency, USB-C charging.",
                    1299m, 150, GetCatId("Electronics"),
                    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80"),

                Product.Create(
                    "Canon PIXMA G3010 All-In-One Ink Tank Colour Printer",
                    "Integrated ink tanks, Wi-Fi, scan and copy, high-yield ink bottles included.",
                    14990m, 16, GetCatId("Electronics"),
                    "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=600&q=80"),

                Product.Create(
                    "Zebronics Zeb-Delight Pro 2.1 Multimedia Speaker 60W",
                    "60W RMS output, wooden subwoofer, RGB LED lights, USB/FM/BT/AUX input.",
                    3499m, 35, GetCatId("Electronics"),
                    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80"),

                Product.Create(
                    "Wipro Garnet 9W LED Smart Bulb B22 Voice Control Pack of 2",
                    "Works with Alexa & Google Home, 16 million colours, schedule & timer, 25000hr life.",
                    799m, 200, GetCatId("Electronics"),
                    "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&q=80"),

                // ── Beauty ───────────────────────────────────────────────────────
                Product.Create(
                    "Himalaya Herbals Anti-Dandruff Hair Cream 100ml Pack of 3",
                    "Tea tree oil formula, controls dandruff and itching, no parabens, dermatologist tested.",
                    549m, 110, GetCatId("Beauty"),
                    "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=600&q=80"),

                Product.Create(
                    "Lakme Sun Expert SPF 50 PA+++ Tinted Sunscreen 100ml",
                    "PA+++ broad spectrum, lightweight tinted formula, non-greasy, daily use.",
                    399m, 75, GetCatId("Beauty"),
                    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80"),

                Product.Create(
                    "Forest Essentials Facial Toner Kewra and Nagkesar 200ml",
                    "Luxury Ayurvedic toner, pore-minimising, handcrafted with natural ingredients.",
                    1895m, 30, GetCatId("Beauty"),
                    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80"),

                Product.Create(
                    "Biotique Bio Papaya Revitalizing Tan-Removal Scrub 75g",
                    "Raw papaya and walnut shell powder, removes tan and dead skin, herbal formula.",
                    149m, 95, GetCatId("Beauty"),
                    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80"),

                Product.Create(
                    "Man Arden 7X Shaving Gel with Vitamin E 200ml",
                    "7-in-1 formula with Vitamin E and aloe vera, provides moisturising smooth shave.",
                    299m, 3, GetCatId("Beauty"),
                    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80")
            };

            context.Set<Product>().AddRange(products);
            context.SaveChanges();

            var greenColor = Console.ForegroundColor;
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine($"Successfully seeded {products.Length} products with images.");
            Console.ForegroundColor = greenColor;
        }
    }
}
