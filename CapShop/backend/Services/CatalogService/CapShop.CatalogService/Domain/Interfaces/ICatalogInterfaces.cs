using CapShop.CatalogService.Domain.Entities;
using CapShop.Shared.Models;

namespace CapShop.CatalogService.Domain.Interfaces;

/// <summary>
/// Product repository interface — defined in Domain, implemented in Infrastructure.
/// Application layer depends only on this interface, never on EF Core.
/// </summary>
public interface IProductRepository
{
    Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<PagedResult<Product>> GetPagedAsync(ProductFilter filter, CancellationToken ct = default);
    Task<IEnumerable<Product>> GetFeaturedAsync(int count = 8, CancellationToken ct = default);
    Task AddAsync(Product product, CancellationToken ct = default);
    Task UpdateAsync(Product product, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}

/// <summary>
/// Category repository interface.
/// </summary>
public interface ICategoryRepository
{
    Task<IEnumerable<Category>> GetAllActiveAsync(CancellationToken ct = default);
    Task<Category?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(Category category, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}

/// <summary>
/// Filter object passed into GetPagedAsync.
/// Encapsulates all search, filter, sort and pagination parameters.
/// Using a dedicated filter object keeps the repository interface clean
/// and avoids method signatures with 8+ parameters.
/// </summary>
public class ProductFilter
{
    public string? SearchQuery { get; set; }  // searches Name + Description
    public int? CategoryId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string SortBy { get; set; } = "name";     // name | price_asc | price_desc | newest
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
    public bool ActiveOnly { get; set; } = true;
}