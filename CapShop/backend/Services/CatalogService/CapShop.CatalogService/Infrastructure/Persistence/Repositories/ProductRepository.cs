using CapShop.CatalogService.Domain.Entities;
using CapShop.CatalogService.Domain.Interfaces;
using CapShop.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace CapShop.CatalogService.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core implementation of IProductRepository.
///
/// GetPagedAsync is the most important method — it handles all
/// search, filter, sort, and pagination in a single optimised
/// LINQ query that EF Core translates to a single SQL statement.
///
/// Key principle: build the IQueryable chain first, call
/// CountAsync once, then Skip/Take for the page. This avoids
/// loading all records into memory before paginating.
/// </summary>
public class ProductRepository : IProductRepository
{
    private readonly CatalogDbContext _context;

    public ProductRepository(CatalogDbContext context)
        => _context = context;

    public async Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _context.Products
                         .Include(p => p.Category)
                         .AsNoTracking()
                         .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<PagedResult<Product>> GetPagedAsync(
        ProductFilter filter,
        CancellationToken ct = default)
    {
        // Start with the full queryable — no DB call yet
        var query = _context.Products
                            .Include(p => p.Category)
                            .AsNoTracking()
                            .AsQueryable();

        // ── Filters — each is optional ───────────────────────────────────
        if (filter.ActiveOnly)
            query = query.Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
        {
            var term = filter.SearchQuery.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.Description.ToLower().Contains(term));
        }

        if (filter.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == filter.CategoryId.Value);

        if (filter.MinPrice.HasValue)
            query = query.Where(p => p.Price >= filter.MinPrice.Value);

        if (filter.MaxPrice.HasValue)
            query = query.Where(p => p.Price <= filter.MaxPrice.Value);

        // ── Sort ──────────────────────────────────────────────────────────
        query = filter.SortBy?.ToLower() switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "newest" => query.OrderByDescending(p => p.CreatedAt),
            _ => query.OrderBy(p => p.Name)   // default: alphabetical
        };

        // ── Count before paginating — one DB round trip ───────────────────
        var totalCount = await query.CountAsync(ct);

        // ── Paginate ──────────────────────────────────────────────────────
        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        return new PagedResult<Product>(items, totalCount, filter.Page, filter.PageSize);
    }

    public async Task<IEnumerable<Product>> GetFeaturedAsync(
        int count = 8,
        CancellationToken ct = default)
        => await _context.Products
                         .Include(p => p.Category)
                         .AsNoTracking()
                         .Where(p => p.IsActive && p.StockQuantity > 0)
                         .OrderByDescending(p => p.CreatedAt)
                         .Take(count)
                         .ToListAsync(ct);

    public async Task AddAsync(Product product, CancellationToken ct = default)
        => await _context.Products.AddAsync(product, ct);

    public Task UpdateAsync(Product product, CancellationToken ct = default)
    {
        _context.Products.Update(product);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}