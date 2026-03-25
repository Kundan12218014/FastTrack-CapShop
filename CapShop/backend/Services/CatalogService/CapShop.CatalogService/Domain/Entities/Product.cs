namespace CapShop.CatalogService.Domain.Entities;

public class Product
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public int StockQuantity { get; private set; }
    public string? ImageUrl { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Foreign key
    public int CategoryId { get; private set; }

    // Navigation property
    public Category Category { get; private set; } = null!;

    // Computed — not stored in DB
    public StockStatus StockStatus => StockQuantity switch
    {
        0 => StockStatus.OutOfStock,
        <= 5 => StockStatus.LowStock,
        _ => StockStatus.InStock
    };

    private Product() { }

    public static Product Create(
        string name,
        string description,
        decimal price,
        int stockQuantity,
        int categoryId,
        string? imageUrl = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Product name is required.", nameof(name));
        if (price <= 0)
            throw new ArgumentException("Price must be greater than zero.", nameof(price));
        if (stockQuantity < 0)
            throw new ArgumentException("Stock quantity cannot be negative.", nameof(stockQuantity));

        return new Product
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Description = description.Trim(),
            Price = price,
            StockQuantity = stockQuantity,
            CategoryId = categoryId,
            ImageUrl = imageUrl?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void Update(
        string name,
        string description,
        decimal price,
        string? imageUrl,
        int categoryId)
    {
        Name = name.Trim();
        Description = description.Trim();
        Price = price;
        ImageUrl = imageUrl?.Trim();
        CategoryId = categoryId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateStock(int quantity)
    {
        if (quantity < 0)
            throw new ArgumentException("Stock quantity cannot be negative.", nameof(quantity));

        StockQuantity = quantity;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate() { IsActive = true; UpdatedAt = DateTime.UtcNow; }
    public void Deactivate() { IsActive = false; UpdatedAt = DateTime.UtcNow; }
}


public enum StockStatus
{
    InStock,
    LowStock,
    OutOfStock
}