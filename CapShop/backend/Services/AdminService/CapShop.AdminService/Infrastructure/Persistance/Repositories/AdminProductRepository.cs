using CapShop.AdminService.Application.DTOs;
using CapShop.AdminService.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CapShop.AdminService.Infrastructure.Persistence.Repositories;

/// <summary>
/// Uses raw SQL with cross-schema joins to read product data
/// from the catalog schema and write changes back to it.
///
/// Why raw SQL here instead of EF Core entities?
/// The Admin Service does not own the catalog schema — it just needs
/// to read and update it. Duplicating the full entity model would create
/// tight coupling. Raw SQL gives us precise control with minimal coupling.
/// </summary>
public class AdminProductRepository : IAdminProductRepository
{
    private readonly AdminDbContext _context;

    public AdminProductRepository(AdminDbContext context)
        => _context = context;

    public async Task<AdminPagedResult<AdminProductDto>> GetPagedAsync(
        string? search, int page, int pageSize, CancellationToken ct = default)
    {
        var searchTerm = $"%{search ?? ""}%";
        var offset = (page - 1) * pageSize;

        var items = await _context.Database
            .SqlQueryRaw<AdminProductDto>($@"
                SELECT
                    p.Id,
                    p.Name,
                    p.Description,
                    p.Price,
                    p.StockQuantity,
                    CASE
                        WHEN p.StockQuantity = 0 THEN 'OutOfStock'
                        WHEN p.StockQuantity <= 5 THEN 'LowStock'
                        ELSE 'InStock'
                    END AS StockStatus,
                    p.ImageUrl,
                    p.IsActive,
                    p.CategoryId,
                    c.Name AS CategoryName,
                    p.CreatedAt,
                    p.UpdatedAt
                FROM CapShopCatalogDB.catalog.Products p
                INNER JOIN CapShopCatalogDB.catalog.Categories c ON c.Id = p.CategoryId
                WHERE (@Search = '%%' OR p.Name LIKE @Search OR p.Description LIKE @Search)
                ORDER BY p.CreatedAt DESC
                OFFSET {offset} ROWS FETCH NEXT {pageSize} ROWS ONLY",
                new Microsoft.Data.SqlClient.SqlParameter("@Search", searchTerm))
            .ToListAsync(ct);

        var totalCount = await _context.Database
            .SqlQueryRaw<int>($@"
                SELECT COUNT(*) AS Value
                FROM CapShopCatalogDB.catalog.Products p
                WHERE (@Search = '%%' OR p.Name LIKE @Search OR p.Description LIKE @Search)",
                new Microsoft.Data.SqlClient.SqlParameter("@Search", searchTerm))
            .FirstOrDefaultAsync(ct);

        return new AdminPagedResult<AdminProductDto>(items, totalCount, page, pageSize);
    }

    public async Task<AdminProductDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _context.Database
            .SqlQueryRaw<AdminProductDto>(@"
                SELECT
                    p.Id, p.Name, p.Description, p.Price, p.StockQuantity,
                    CASE
                        WHEN p.StockQuantity = 0 THEN 'OutOfStock'
                        WHEN p.StockQuantity <= 5 THEN 'LowStock'
                        ELSE 'InStock'
                    END AS StockStatus,
                    p.ImageUrl, p.IsActive, p.CategoryId,
                    c.Name AS CategoryName, p.CreatedAt, p.UpdatedAt
                FROM CapShopCatalogDB.catalog.Products p
                INNER JOIN CapShopCatalogDB.catalog.Categories c ON c.Id = p.CategoryId
                WHERE p.Id = @Id",
                new Microsoft.Data.SqlClient.SqlParameter("@Id", id))
            .FirstOrDefaultAsync(ct);

    public async Task CreateAsync(CreateProductDto dto, CancellationToken ct = default)
    {
        await _context.Database.ExecuteSqlRawAsync(@"
            INSERT INTO CapShopCatalogDB.catalog.Products
                (Id, Name, Description, Price, StockQuantity, CategoryId, ImageUrl, IsActive, CreatedAt, UpdatedAt)
            VALUES
                (@Id, @Name, @Desc, @Price, @Stock, @CatId, @Img, @Active, @Now, @Now)",
            new Microsoft.Data.SqlClient.SqlParameter("@Id", Guid.NewGuid()),
            new Microsoft.Data.SqlClient.SqlParameter("@Name", dto.Name),
            new Microsoft.Data.SqlClient.SqlParameter("@Desc", dto.Description),
            new Microsoft.Data.SqlClient.SqlParameter("@Price", dto.Price),
            new Microsoft.Data.SqlClient.SqlParameter("@Stock", dto.StockQuantity),
            new Microsoft.Data.SqlClient.SqlParameter("@CatId", dto.CategoryId),
            new Microsoft.Data.SqlClient.SqlParameter("@Img", (object?)dto.ImageUrl ?? DBNull.Value),
            new Microsoft.Data.SqlClient.SqlParameter("@Active", dto.IsActive),
            new Microsoft.Data.SqlClient.SqlParameter("@Now", DateTime.UtcNow));
    }

    public async Task UpdateAsync(Guid id, UpdateProductDto dto, CancellationToken ct = default)
    {
        await _context.Database.ExecuteSqlRawAsync(@"
            UPDATE CapShopCatalogDB.catalog.Products
            SET Name = @Name, Description = @Desc, Price = @Price,
                CategoryId = @CatId, ImageUrl = @Img, UpdatedAt = @Now
            WHERE Id = @Id",
            new Microsoft.Data.SqlClient.SqlParameter("@Id", id),
            new Microsoft.Data.SqlClient.SqlParameter("@Name", dto.Name),
            new Microsoft.Data.SqlClient.SqlParameter("@Desc", dto.Description),
            new Microsoft.Data.SqlClient.SqlParameter("@Price", dto.Price),
            new Microsoft.Data.SqlClient.SqlParameter("@CatId", dto.CategoryId),
            new Microsoft.Data.SqlClient.SqlParameter("@Img", (object?)dto.ImageUrl ?? DBNull.Value),
            new Microsoft.Data.SqlClient.SqlParameter("@Now", DateTime.UtcNow));
    }

    public async Task UpdateStockAsync(Guid id, int quantity, CancellationToken ct = default)
    {
        await _context.Database.ExecuteSqlRawAsync(@"
            UPDATE CapShopCatalogDB.catalog.Products
            SET StockQuantity = @Qty, UpdatedAt = @Now
            WHERE Id = @Id",
            new Microsoft.Data.SqlClient.SqlParameter("@Id", id),
            new Microsoft.Data.SqlClient.SqlParameter("@Qty", quantity),
            new Microsoft.Data.SqlClient.SqlParameter("@Now", DateTime.UtcNow));
    }

    public async Task SetActiveAsync(Guid id, bool isActive, CancellationToken ct = default)
    {
        await _context.Database.ExecuteSqlRawAsync(@"
            UPDATE CapShopCatalogDB.catalog.Products
            SET IsActive = @Active, UpdatedAt = @Now
            WHERE Id = @Id",
            new Microsoft.Data.SqlClient.SqlParameter("@Id", id),
            new Microsoft.Data.SqlClient.SqlParameter("@Active", isActive),
            new Microsoft.Data.SqlClient.SqlParameter("@Now", DateTime.UtcNow));
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        // Soft delete — set IsActive = false, never hard delete
        await SetActiveAsync(id, false, ct);
    }
}