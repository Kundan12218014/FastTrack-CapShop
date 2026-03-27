using CapShop.AdminService.Application.DTOs;
using CapShop.AdminService.Domain.Entities;

namespace CapShop.AdminService.Domain.Interfaces;

/// <summary>
/// Admin repository reads cross-schema data via raw SQL or EF Core
/// queries joining catalog + orders + auth schemas.
/// All read models return DTOs directly — not domain entities.
/// </summary>
public interface IAdminProductRepository
{
    Task<AdminPagedResult<AdminProductDto>> GetPagedAsync(
        string? search, int page, int pageSize, CancellationToken ct = default);

    Task<AdminProductDto?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task CreateAsync(CreateProductDto dto, CancellationToken ct = default);

    Task UpdateAsync(Guid id, UpdateProductDto dto, CancellationToken ct = default);

    Task UpdateStockAsync(Guid id, int quantity, CancellationToken ct = default);

    Task SetActiveAsync(Guid id, bool isActive, CancellationToken ct = default);

    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IAdminOrderRepository
{
    Task<AdminPagedResult<AdminOrderSummaryDto>> GetPagedAsync(
        string? search, string? status, int page, int pageSize,
        CancellationToken ct = default);

    Task<AdminOrderDetailDto?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task UpdateStatusAsync(
        Guid id, string newStatus, string changedBy,
        CancellationToken ct = default);
}

public interface IDashboardRepository
{
    Task<DashboardSummaryDto> GetSummaryAsync(CancellationToken ct = default);
}

public interface IReportsRepository
{
    Task<SalesReportDto> GetSalesReportAsync(DateTime from, DateTime to,
                                  CancellationToken ct = default);
    Task<StatusSplitReportDto> GetStatusSplitAsync(CancellationToken ct = default);
}

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog log, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}