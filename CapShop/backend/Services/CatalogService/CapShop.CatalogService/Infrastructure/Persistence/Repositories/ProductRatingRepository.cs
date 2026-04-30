using CapShop.CatalogService.Domain.Entities;
using CapShop.CatalogService.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CapShop.CatalogService.Infrastructure.Persistence.Repositories;

public class ProductRatingRepository : IProductRatingRepository
{
    private readonly CatalogDbContext _context;

    public ProductRatingRepository(CatalogDbContext context)
        => _context = context;

    public async Task<IEnumerable<ProductRating>> GetByProductIdAsync(
        Guid productId, int limit = 20, CancellationToken ct = default)
        => await _context.ProductRatings
                         .AsNoTracking()
                         .Where(r => r.ProductId == productId)
                         .OrderByDescending(r => r.CreatedAt)
                         .Take(limit)
                         .ToListAsync(ct);

    public async Task<(double Average, int Count)> GetAggregateAsync(
        Guid productId, CancellationToken ct = default)
    {
        var ratings = await _context.ProductRatings
                                    .AsNoTracking()
                                    .Where(r => r.ProductId == productId)
                                    .Select(r => r.Stars)
                                    .ToListAsync(ct);

        if (ratings.Count == 0) return (0.0, 0);
        return (Math.Round(ratings.Average(), 1), ratings.Count);
    }

    public async Task<ProductRating?> GetByUserAndProductAsync(
        Guid userId, Guid productId, CancellationToken ct = default)
        => await _context.ProductRatings
                         .AsNoTracking()
                         .FirstOrDefaultAsync(
                             r => r.UserId == userId && r.ProductId == productId, ct);

    public async Task AddAsync(ProductRating rating, CancellationToken ct = default)
        => await _context.ProductRatings.AddAsync(rating, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}
