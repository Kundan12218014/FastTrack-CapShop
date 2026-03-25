using CapShop.CatalogService.Domain.Entities;
using CapShop.CatalogService.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CapShop.CatalogService.Infrastructure.Persistence.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly CatalogDbContext _context;

    public CategoryRepository(CatalogDbContext context)
        => _context = context;

    public async Task<IEnumerable<Category>> GetAllActiveAsync(CancellationToken ct = default)
        => await _context.Categories
                         .AsNoTracking()
                         .Where(c => c.IsActive)
                         .OrderBy(c => c.DisplayOrder)
                         .ToListAsync(ct);

    public async Task<Category?> GetByIdAsync(int id, CancellationToken ct = default)
        => await _context.Categories
                         .AsNoTracking()
                         .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task AddAsync(Category category, CancellationToken ct = default)
        => await _context.Categories.AddAsync(category, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}