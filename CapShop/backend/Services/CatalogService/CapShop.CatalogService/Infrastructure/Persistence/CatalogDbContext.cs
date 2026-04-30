using CapShop.CatalogService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CapShop.CatalogService.Infrastructure.Persistence;

/// <summary>
/// EF Core DbContext for the Catalog Service.
/// Schema = "catalog" — coexists with other services on shared SQL Server.
///
/// After any entity change run in Package Manager Console
/// (Default project = CapShop.CatalogService):
///   Add-Migration InitialCreate
///   Update-Database
///
/// Verify in SSMS: CapShopDB → catalog → Tables
///   catalog.Categories
///   catalog.Products
/// </summary>
public class CatalogDbContext : DbContext
{
    public CatalogDbContext(DbContextOptions<CatalogDbContext> options)
        : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<ProductRating> ProductRatings => Set<ProductRating>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("catalog");

        // ── Category ──────────────────────────────────────────────────────
        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("Categories");
            entity.HasKey(c => c.Id);

            entity.Property(c => c.Id)
                  .ValueGeneratedOnAdd(); // int PK — DB generates it

            entity.Property(c => c.Name)
                  .IsRequired()
                  .HasMaxLength(100);

            entity.Property(c => c.Description)
                  .HasMaxLength(500);

            entity.Property(c => c.DisplayOrder)
                  .HasDefaultValue(0);

            entity.Property(c => c.IsActive)
                  .HasDefaultValue(true);

            entity.HasIndex(c => c.Name)
                  .IsUnique()
                  .HasDatabaseName("IX_Categories_Name");
        });

        // ── Product ───────────────────────────────────────────────────────
        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("Products");
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Id)
                  .ValueGeneratedNever(); // Guid set in domain factory

            entity.Property(p => p.Name)
                  .IsRequired()
                  .HasMaxLength(200);

            entity.Property(p => p.Description)
                  .HasMaxLength(2000);

            // decimal(18,2) is standard for money columns in SQL Server
            entity.Property(p => p.Price)
                  .IsRequired()
                  .HasColumnType("decimal(18,2)");

            entity.Property(p => p.StockQuantity)
                  .IsRequired()
                  .HasDefaultValue(0);

            entity.Property(p => p.ImageUrl)
                  .HasMaxLength(500);

            entity.Property(p => p.IsActive)
                  .HasDefaultValue(true);

            entity.Property(p => p.CreatedAt).IsRequired();
            entity.Property(p => p.UpdatedAt).IsRequired();

            // StockStatus is computed in C# — not stored in DB
            entity.Ignore(p => p.StockStatus);

            // Relationship: Product → Category (many-to-one)
            entity.HasOne(p => p.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict); // prevent cascade delete

            // Indexes for common query patterns
            entity.HasIndex(p => p.CategoryId)
                  .HasDatabaseName("IX_Products_CategoryId");

            entity.HasIndex(p => p.IsActive)
                  .HasDatabaseName("IX_Products_IsActive");

            entity.HasIndex(p => p.Price)
                  .HasDatabaseName("IX_Products_Price");

            entity.HasIndex(p => p.CreatedAt)
                  .HasDatabaseName("IX_Products_CreatedAt");
        });

        // ── ProductRating ─────────────────────────────────────────────────
        modelBuilder.Entity<ProductRating>(entity =>
        {
            entity.ToTable("ProductRatings");
            entity.HasKey(r => r.Id);

            entity.Property(r => r.Id).ValueGeneratedNever();
            entity.Property(r => r.UserName).IsRequired().HasMaxLength(200);
            entity.Property(r => r.Stars).IsRequired();
            entity.Property(r => r.ReviewText).HasMaxLength(1000);
            entity.Property(r => r.CreatedAt).IsRequired();

            entity.HasOne(r => r.Product)
                  .WithMany()
                  .HasForeignKey(r => r.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            // One rating per user per product
            entity.HasIndex(r => new { r.UserId, r.ProductId })
                  .IsUnique()
                  .HasDatabaseName("IX_ProductRatings_UserId_ProductId");

            entity.HasIndex(r => r.ProductId)
                  .HasDatabaseName("IX_ProductRatings_ProductId");
        });

        // ── Seed Categories ───────────────────────────────────────────────
        // Seeded so the app has data without manual DB inserts.
        modelBuilder.Entity<Category>().HasData(
            new { Id = 1, Name = "Electronics", Description = "Phones, laptops, gadgets", DisplayOrder = 1, IsActive = true },
            new { Id = 2, Name = "Clothing", Description = "Shirts, pants, shoes", DisplayOrder = 2, IsActive = true },
            new { Id = 3, Name = "Home & Kitchen", Description = "Appliances, cookware", DisplayOrder = 3, IsActive = true },
            new { Id = 4, Name = "Books", Description = "Fiction, non-fiction", DisplayOrder = 4, IsActive = true },
            new { Id = 5, Name = "Sports", Description = "Equipment, accessories", DisplayOrder = 5, IsActive = true }
        );
    }
}