using CapShop.AdminService.Domain.Entities;
using CapShop.AdminService.Domain.Interfaces;

namespace CapShop.AdminService.Infrastructure.Persistence.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly AdminDbContext _context;

    public AuditLogRepository(AdminDbContext context)
        => _context = context;

    public async Task AddAsync(AuditLog log, CancellationToken ct = default)
        => await _context.AuditLogs.AddAsync(log, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}