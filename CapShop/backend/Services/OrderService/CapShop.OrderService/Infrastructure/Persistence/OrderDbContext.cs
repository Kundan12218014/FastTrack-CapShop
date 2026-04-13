using CapShop.OrderService.Domain.Entities;
using CapShop.OrderService.Domain.Enums;
using CapShop.OrderService.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace CapShop.OrderService.Infrastructure.Persistence;

/// <summary>
/// EF Core DbContext for the Order Service.
/// Schema = "orders"
///
/// Key EF Core patterns used here:
///  - OwnsOne() for ShippingAddress value object
///  - HasConversion() to store OrderStatus enum as string (readable in DB)
///  - HasPrivateConstructor() to allow EF to instantiate private constructors
///  - Shadow properties for FK navigation where needed
/// </summary>
public class OrderDbContext : DbContext
{
    public OrderDbContext(DbContextOptions<OrderDbContext> options)
        : base(options) { }

    public DbSet<Cart> Orders => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> OrderSet => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderStatusHistory> StatusHistory => Set<OrderStatusHistory>();
    public DbSet<PaymentSimulation> Payments => Set<PaymentSimulation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema("orders");

        // ── Cart ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Cart>(entity =>
        {
            entity.ToTable("Carts");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).ValueGeneratedNever();
            entity.Property(c => c.UserId).IsRequired();
            entity.Property(c => c.Status).IsRequired().HasMaxLength(20);
            entity.Property(c => c.CreatedAt).IsRequired();
            entity.Property(c => c.UpdatedAt).IsRequired();

            entity.HasIndex(c => c.UserId)
                  .HasDatabaseName("IX_Carts_UserId");
            entity.HasIndex(c => new { c.UserId, c.Status })
                  .HasDatabaseName("IX_Carts_UserId_Status");

            // Configure the private backing field _items
            entity.HasMany(c => c.Items)
                  .WithOne()
                  .HasForeignKey(i => i.CartId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Navigation(c => c.Items)
                  .UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        // ── CartItem ──────────────────────────────────────────────────────
        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.ToTable("CartItems");
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Id).ValueGeneratedNever();
            entity.Property(i => i.CartId).IsRequired();
            entity.Property(i => i.ProductId).IsRequired();
            entity.Property(i => i.ProductName).IsRequired().HasMaxLength(200);
            entity.Property(i => i.UnitPrice).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(i => i.Quantity).IsRequired();
            entity.Property(i => i.AddedAt).IsRequired();
            entity.Ignore(i => i.LineTotal);
        });

        // ── Order ─────────────────────────────────────────────────────────
        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders");
            entity.HasKey(o => o.Id);
            entity.Property(o => o.Id).ValueGeneratedNever();
            entity.Property(o => o.OrderNumber).IsRequired().HasMaxLength(30);
            entity.Property(o => o.UserId).IsRequired();
            entity.Property(o => o.CustomerEmail).IsRequired().HasMaxLength(255);
            entity.Property(o => o.TotalAmount).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(o => o.PaymentMethod).IsRequired().HasMaxLength(20);
            entity.Property(o => o.PaymentTransactionId).HasMaxLength(50);
            entity.Property(o => o.PlacedAt).IsRequired();
            entity.Property(o => o.UpdatedAt).IsRequired();

            // Store enum as string — readable in SSMS without lookup table
            entity.Property(o => o.Status)
                  .IsRequired()
                  .HasMaxLength(30)
                  .HasConversion<string>();

            // ShippingAddress is an owned entity — columns live in Orders table
            entity.OwnsOne(o => o.ShippingAddress, addr =>
            {
                addr.Property(a => a.FullName).IsRequired().HasMaxLength(100).HasColumnName("ShipFullName");
                addr.Property(a => a.AddressLine).IsRequired().HasMaxLength(300).HasColumnName("ShipAddressLine");
                addr.Property(a => a.City).IsRequired().HasMaxLength(100).HasColumnName("ShipCity");
                addr.Property(a => a.State).IsRequired().HasMaxLength(100).HasColumnName("ShipState");
                addr.Property(a => a.Pincode).IsRequired().HasMaxLength(6).HasColumnName("ShipPincode");
                addr.Property(a => a.PhoneNumber).IsRequired().HasMaxLength(15).HasColumnName("ShipPhoneNumber");
            });

            entity.HasIndex(o => o.UserId)
                  .HasDatabaseName("IX_Orders_UserId");
            entity.HasIndex(o => o.Status)
                  .HasDatabaseName("IX_Orders_Status");
            entity.HasIndex(o => o.OrderNumber)
                  .IsUnique()
                  .HasDatabaseName("IX_Orders_OrderNumber");

            // Configure private backing fields for navigation collections
            entity.HasMany(o => o.Items)
                  .WithOne()
                  .HasForeignKey(i => i.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(o => o.History)
                  .WithOne()
                  .HasForeignKey(h => h.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Navigation(o => o.Items)
                  .UsePropertyAccessMode(PropertyAccessMode.Field);
            entity.Navigation(o => o.History)
                  .UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        // ── OrderItem ─────────────────────────────────────────────────────
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("OrderItems");
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Id).ValueGeneratedNever();
            entity.Property(i => i.OrderId).IsRequired();
            entity.Property(i => i.ProductId).IsRequired();
            entity.Property(i => i.ProductName).IsRequired().HasMaxLength(200);
            entity.Property(i => i.Quantity).IsRequired();
            entity.Property(i => i.UnitPrice).IsRequired().HasColumnType("decimal(18,2)");
            entity.Ignore(i => i.LineTotal);
        });

        // ── OrderStatusHistory ────────────────────────────────────────────
        modelBuilder.Entity<OrderStatusHistory>(entity =>
        {
            entity.ToTable("OrderStatusHistory");
            entity.HasKey(h => h.Id);
            entity.Property(h => h.Id).ValueGeneratedNever();
            entity.Property(h => h.OrderId).IsRequired();
            entity.Property(h => h.FromStatus).HasMaxLength(30).HasConversion<string?>();
            entity.Property(h => h.ToStatus).IsRequired().HasMaxLength(30).HasConversion<string>();
            entity.Property(h => h.ChangedBy).IsRequired().HasMaxLength(100);
            entity.Property(h => h.Remarks).HasMaxLength(500);
            entity.Property(h => h.ChangedAt).IsRequired();
        });

        // ── PaymentSimulation ─────────────────────────────────────────────
        modelBuilder.Entity<PaymentSimulation>(entity =>
        {
            entity.ToTable("PaymentSimulations");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Id).ValueGeneratedNever();
            entity.Property(p => p.OrderId).IsRequired();
            entity.Property(p => p.Method).IsRequired().HasMaxLength(20);
            entity.Property(p => p.TransactionId).IsRequired().HasMaxLength(50);
            entity.Property(p => p.IsSuccess).IsRequired();
            entity.Property(p => p.FailureReason).HasMaxLength(200);
            entity.Property(p => p.SimulatedAt).IsRequired();
        });
    }
}