using System;
using System.Collections.Generic;
using System.Linq;
using CapShop.OrderService.Domain.Entities;
using CapShop.OrderService.Domain.Enums;
using CapShop.OrderService.Domain.ValueObjects;
using CapShop.OrderService.Infrastructure.Persistence;
using CapShop.AuthService.Domain.Entities;
using CapShop.CatalogService.Domain.Entities;
using CapShop.AuthService.Infrastructure.Persistence;
using CapShop.CatalogService.Infrastructure.Persistence;

namespace CapShop.DataSeeder
{
    public static class OrderSeeder
    {
        public static void Seed(AuthDbContext authContext, CatalogDbContext catalogContext, OrderDbContext orderContext)
        {
            Console.WriteLine("Seeding Orders...");
            if (orderContext.Set<Order>().Any())
            {
                var originalColor = Console.ForegroundColor;
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("Orders already seeded. Skipping.");
                Console.ForegroundColor = originalColor;
                return;
            }

            var users = authContext.Set<User>().ToList();
            var products = catalogContext.Set<Product>().ToList();

            var admin = users.First(u => u.Role == UserRoles.Admin);

            Guid GetUserId(string emailPrefix) => users.First(u => u.Email.StartsWith(emailPrefix)).Id;

            CartItem CreateCartItem(string productName, int qty)
            {
                var prod = products.First(p => p.Name.Contains(productName));
                return CartItem.Create(Guid.NewGuid(), prod.Id, prod.Name, prod.Price, qty);
            }

            var ordersData = new[]
            {
                new { 
                    UserId = GetUserId("priya.patel"), Status = OrderStatus.Delivered, Payment = "UPI", 
                    City = "Mumbai", State = "MH", Pincode = "400054",
                    Items = new List<CartItem> { CreateCartItem("Galaxy M34", 1), CreateCartItem("Lakme Sunscreen", 1), CreateCartItem("boAt Earbuds", 1) } 
                },
                new { 
                    UserId = GetUserId("arjun.mehta"), Status = OrderStatus.Shipped, Payment = "Card", 
                    City = "Noida", State = "UP", Pincode = "201301",
                    Items = new List<CartItem> { CreateCartItem("HP Pavilion", 1) } 
                },
                new { 
                    UserId = GetUserId("sunita.reddy"), Status = OrderStatus.Packed, Payment = "COD", 
                    City = "Bangalore", State = "KA", Pincode = "560038",
                    Items = new List<CartItem> { CreateCartItem("Levis", 1), CreateCartItem("Raymond", 1) } 
                },
                new { 
                    UserId = GetUserId("vikram.singh"), Status = OrderStatus.Paid, Payment = "UPI", 
                    City = "Dehradun", State = "UK", Pincode = "248001",
                    Items = new List<CartItem> { CreateCartItem("ASUS TUF", 1), CreateCartItem("boAt Earbuds", 2), CreateCartItem("Wipro", 1) } 
                },
                new { 
                    UserId = GetUserId("kavitha.nair"), Status = OrderStatus.Cancelled, Payment = "UPI", 
                    City = "Thiruvananthapuram", State = "KL", Pincode = "695004",
                    Items = new List<CartItem> { CreateCartItem("Manyavar Kurta", 1), CreateCartItem("Wings of Fire", 2) } 
                },
                new { 
                    UserId = GetUserId("rohit.gupta"), Status = OrderStatus.Delivered, Payment = "Card", 
                    City = "Jaipur", State = "RJ", Pincode = "302021",
                    Items = new List<CartItem> { CreateCartItem("Prestige", 1), CreateCartItem("Butterfly", 2) } 
                },
                new { 
                    UserId = GetUserId("ananya.iyer"), Status = OrderStatus.Delivered, Payment = "COD", 
                    City = "Chennai", State = "TN", Pincode = "600017",
                    Items = new List<CartItem> { CreateCartItem("Ikigai", 2), CreateCartItem("Atomic Habits", 1), CreateCartItem("Biotique", 2) } 
                },
                new { 
                    UserId = GetUserId("suresh.kumar"), Status = OrderStatus.Shipped, Payment = "UPI", 
                    City = "Hyderabad", State = "TS", Pincode = "500034",
                    Items = new List<CartItem> { CreateCartItem("Redmi Note", 1) } 
                },
                new { 
                    UserId = GetUserId("deepika.pillai"), Status = OrderStatus.Paid, Payment = "Card", 
                    City = "Pune", State = "MH", Pincode = "411001",
                    Items = new List<CartItem> { CreateCartItem("MacBook", 1), CreateCartItem("Wipro", 1), CreateCartItem("Milton", 1) } 
                },
                new { 
                    UserId = GetUserId("manish.joshi"), Status = OrderStatus.Packed, Payment = "COD", 
                    City = "Bhopal", State = "MP", Pincode = "462001",
                    Items = new List<CartItem> { CreateCartItem("Yoga Mat", 1), CreateCartItem("Wings of Fire", 3), CreateCartItem("NCERT", 1) } 
                }
            };

            var createdOrders = new List<Order>();

            foreach (var od in ordersData)
            {
                var address = new ShippingAddress("Seed User", "123 Seed Street", od.City, od.State, od.Pincode, "9999999999");
                var order = Order.Create(od.UserId, address, od.Payment, od.Items);
                
                string adminId = admin.Id.ToString();

                if (od.Status == OrderStatus.Delivered)
                {
                    order.UpdateStatus(OrderStatus.Packed, adminId);
                    order.UpdateStatus(OrderStatus.Shipped, adminId);
                    order.UpdateStatus(OrderStatus.Delivered, adminId);
                }
                else if (od.Status == OrderStatus.Shipped)
                {
                    order.UpdateStatus(OrderStatus.Packed, adminId);
                    order.UpdateStatus(OrderStatus.Shipped, adminId);
                }
                else if (od.Status == OrderStatus.Packed)
                {
                    order.UpdateStatus(OrderStatus.Packed, adminId);
                }
                else if (od.Status == OrderStatus.Cancelled)
                {
                    order.UpdateStatus(OrderStatus.Cancelled, od.UserId.ToString(), "Cancelled by customer");
                }

                createdOrders.Add(order);
                orderContext.Set<Order>().Add(order);
            }

            orderContext.SaveChanges();

            int deliveredCount = createdOrders.Count(o => o.Status == OrderStatus.Delivered);
            int shippedCount = createdOrders.Count(o => o.Status == OrderStatus.Shipped);
            int packedCount = createdOrders.Count(o => o.Status == OrderStatus.Packed);
            int paidCount = createdOrders.Count(o => o.Status == OrderStatus.Paid);
            int cancelledCount = createdOrders.Count(o => o.Status == OrderStatus.Cancelled);
            int orderItemCount = createdOrders.Sum(o => o.Items.Count);

            var greenColor = Console.ForegroundColor;
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine($"Successfully seeded {createdOrders.Count} orders.");
            Console.WriteLine($"  - Delivered: {deliveredCount}");
            Console.WriteLine($"  - Shipped: {shippedCount}");
            Console.WriteLine($"  - Packed: {packedCount}");
            Console.WriteLine($"  - Paid: {paidCount}");
            Console.WriteLine($"  - Cancelled: {cancelledCount}");
            Console.WriteLine($"  - Order Items: {orderItemCount}");
            Console.ForegroundColor = greenColor;
        }
    }
}
