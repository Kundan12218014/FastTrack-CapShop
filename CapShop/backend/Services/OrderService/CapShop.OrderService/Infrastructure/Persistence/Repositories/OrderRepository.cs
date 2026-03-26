using CapShop.OrderService.Domain.Entities;
using CapShop.OrderService.Domain.Enums;
using CapShop.OrderService.Domain.Interfaces;
using CapShop.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace CapShop.OrderService.Infrastructure.Persistence.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly OrderDbContext _context;

    public OrderRepository(OrderDbContext context) => _context = context;

    public async Task<Order?> GetByIdAsync(
        Guid orderId, CancellationToken ct = default)
        => await _context.OrderSet
                         .Include(o => o.Items)
                         .Include(o => o.History)
                         .FirstOrDefaultAsync(o => o.Id == orderId, ct);

    public async Task<PagedResult<Order>> GetByUserIdAsync(
        Guid userId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _context.OrderSet
                            .Include(o => o.Items)
                            .Where(o => o.UserId == userId)
                            .OrderByDescending(o => o.PlacedAt)
                            .AsNoTracking();

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<Order>(items, total, page, pageSize);
    }

    public async Task<PagedResult<Order>> GetAllAsync(
        int page, int pageSize,
        OrderStatus? statusFilter,
        CancellationToken ct = default)
    {
        var query = _context.OrderSet
                            .Include(o => o.Items)
                            .AsNoTracking()
                            .AsQueryable();

        if (statusFilter.HasValue)
            query = query.Where(o => o.Status == statusFilter.Value);

        query = query.OrderByDescending(o => o.PlacedAt);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<Order>(items, total, page, pageSize);
    }

    public async Task AddAsync(Order order, CancellationToken ct = default)
        => await _context.OrderSet.AddAsync(order, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}