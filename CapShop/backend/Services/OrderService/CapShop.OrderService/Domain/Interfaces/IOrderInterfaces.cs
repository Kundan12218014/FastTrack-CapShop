using CapShop.OrderService.Domain.Entities;
using CapShop.OrderService.Domain.Enums;
using CapShop.Shared.Models;

namespace CapShop.OrderService.Domain.Interfaces;

public interface ICartRepository
{
    Task<Cart?> GetActiveCartByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<Cart?> GetByIdAsync(Guid cartId, CancellationToken ct = default);
    Task AddAsync(Cart cart, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid orderId, CancellationToken ct = default);
    Task<PagedResult<Order>> GetByUserIdAsync(Guid userId, int page, int pageSize, CancellationToken ct = default);
    Task<PagedResult<Order>> GetAllAsync(int page, int pageSize, OrderStatus? statusFilter, CancellationToken ct = default);
    Task AddAsync(Order order, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}

public interface IPaymentSimulationRepository
{
    Task AddAsync(PaymentSimulation payment, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}