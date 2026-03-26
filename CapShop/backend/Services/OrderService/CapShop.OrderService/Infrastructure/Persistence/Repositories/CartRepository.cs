using CapShop.OrderService.Domain.Entities;
using CapShop.OrderService.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CapShop.OrderService.Infrastructure.Persistence.Repositories;

public class CartRepository : ICartRepository
{
    private readonly OrderDbContext _context;

    public CartRepository(OrderDbContext context) => _context = context;

    public async Task<Cart?> GetActiveCartByUserIdAsync(
        Guid userId, CancellationToken ct = default)
        => await _context.Orders
                         .Include(c => c.Items)
                         .FirstOrDefaultAsync(
                             c => c.UserId == userId
                               && c.Status == CartStatus.Active, ct);

    public async Task<Cart?> GetByIdAsync(
        Guid cartId, CancellationToken ct = default)
        => await _context.Orders
                         .Include(c => c.Items)
                         .FirstOrDefaultAsync(c => c.Id == cartId, ct);

    public async Task AddAsync(Cart cart, CancellationToken ct = default)
        => await _context.Orders.AddAsync(cart, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}