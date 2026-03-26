using CapShop.OrderService.Domain.Entities;
using CapShop.OrderService.Domain.Interfaces;

namespace CapShop.OrderService.Infrastructure.Persistence.Repositories;

public class PaymentRepository : IPaymentSimulationRepository
{
    private readonly OrderDbContext _context;

    public PaymentRepository(OrderDbContext context) => _context = context;

    public async Task AddAsync(PaymentSimulation payment, CancellationToken ct = default)
        => await _context.Payments.AddAsync(payment, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}