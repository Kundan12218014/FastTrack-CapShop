using CapShop.AdminService.Application.DTOs;
using CapShop.AdminService.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CapShop.AdminService.Infrastructure.Persistence.Repositories;

public class DashboardRepository : IDashboardRepository
{
    private readonly AdminDbContext _context;

    public DashboardRepository(AdminDbContext context)
        => _context = context;

    public async Task<DashboardSummaryDto> GetSummaryAsync(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;

        // All aggregates in one SQL query for efficiency
        var summary = await _context.Database
            .SqlQueryRaw<DashboardSummaryRaw>(@"
                SELECT
                    (SELECT ISNULL(SUM(TotalAmount), 0)
                     FROM orders.Orders WHERE Status = 'Delivered') AS TotalRevenue,

                    (SELECT COUNT(*) FROM orders.Orders) AS TotalOrders,

                    (SELECT COUNT(*) FROM auth.Users WHERE Role = 'Customer') AS TotalCustomers,

                    (SELECT COUNT(*) FROM orders.Orders
                     WHERE Status IN ('Paid', 'Packed', 'Shipped')) AS PendingOrders,

                    (SELECT COUNT(*) FROM catalog.Products WHERE IsActive = 1) AS TotalProducts,

                    (SELECT COUNT(*) FROM catalog.Products
                     WHERE IsActive = 1 AND StockQuantity <= 5) AS LowStockProducts,

                    (SELECT ISNULL(SUM(TotalAmount), 0)
                     FROM orders.Orders
                     WHERE Status = 'Delivered'
                       AND CAST(PlacedAt AS DATE) = CAST(GETUTCDATE() AS DATE)) AS RevenueToday,

                    (SELECT COUNT(*) FROM orders.Orders
                     WHERE CAST(PlacedAt AS DATE) = CAST(GETUTCDATE() AS DATE)) AS OrdersToday")
            .FirstOrDefaultAsync(ct) ?? new DashboardSummaryRaw();

        var recentOrders = await _context.Database
            .SqlQueryRaw<RecentOrderDto>(@"
                SELECT TOP 10
                    o.Id, o.OrderNumber,
                    ISNULL(u.Email, 'Unknown') AS CustomerEmail,
                    o.TotalAmount, o.Status, o.PlacedAt
                FROM orders.Orders o
                LEFT JOIN auth.Users u ON u.Id = o.UserId
                ORDER BY o.PlacedAt DESC")
            .ToListAsync(ct);

        return new DashboardSummaryDto
        {
            TotalRevenue = summary.TotalRevenue,
            TotalOrders = summary.TotalOrders,
            TotalCustomers = summary.TotalCustomers,
            PendingOrders = summary.PendingOrders,
            TotalProducts = summary.TotalProducts,
            LowStockProducts = summary.LowStockProducts,
            RevenueToday = summary.RevenueToday,
            OrdersToday = summary.OrdersToday,
            RecentOrders = recentOrders
        };
    }

    // Internal projection class for the raw SQL query result
    private class DashboardSummaryRaw
    {
        public decimal TotalRevenue { get; set; }
        public int TotalOrders { get; set; }
        public int TotalCustomers { get; set; }
        public int PendingOrders { get; set; }
        public int TotalProducts { get; set; }
        public int LowStockProducts { get; set; }
        public decimal RevenueToday { get; set; }
        public int OrdersToday { get; set; }
    }
}