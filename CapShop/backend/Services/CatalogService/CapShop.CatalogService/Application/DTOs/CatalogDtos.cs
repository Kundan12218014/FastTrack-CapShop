namespace CapShop.CatalogService.Application.DTOs;

// ── RESPONSE DTOs ─────────────────────────────────────────────────────────

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class ProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public string StockStatus { get; set; } = string.Empty;  // "InStock" | "LowStock" | "OutOfStock"
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    // Rating aggregate — populated on demand
    public double AverageRating { get; set; }
    public int RatingCount { get; set; }
}

// ── Rating DTOs ───────────────────────────────────────────────────────────

public class ProductRatingDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int Stars { get; set; }
    public string? ReviewText { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateRatingRequestDto
{
    public int Stars { get; set; }
    public string? ReviewText { get; set; }
}

public class RatingAggregateDto
{
    public double Average { get; set; }
    public int Count { get; set; }
    public Dictionary<int, int> Distribution { get; set; } = new();
}

// ── REQUEST DTOs ──────────────────────────────────────────────────────────

public class GetProductsRequestDto
{
    public string? Query { get; set; }
    public int? CategoryId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string SortBy { get; set; } = "name";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}