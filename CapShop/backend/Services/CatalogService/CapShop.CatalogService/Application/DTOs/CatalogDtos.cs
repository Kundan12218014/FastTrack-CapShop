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