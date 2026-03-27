using CapShop.AdminService.Application.DTOs;
using CapShop.AdminService.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CapShop.AdminService.Infrastructure.Persistence.Repositories;

public class ReportsRepository : IReportsRepository
{
    private readonly AdminDbContext _context;

    public ReportsRepository(AdminDbContext context)
        => _context = context;

    public async Task<SalesReportDto> GetSalesReportAsync(
        DateTime from, DateTime to, CancellationToken ct = default)
    {
        var dailyBreakdown = await _context.Database
            .SqlQueryRaw<DailySalesDto>(@"
                SELECT
                    CAST(PlacedAt AS DATE) AS Date,
                    ISNULL(SUM(TotalAmount), 0) AS Revenue,
                    COUNT(*) AS Orders
                FROM orders.Orders
                WHERE Status IN ('Paid','Packed','Shipped','Delivered')
                  AND PlacedAt >= @From AND PlacedAt <= @To
                GROUP BY CAST(PlacedAt AS DATE)
                ORDER BY CAST(PlacedAt AS DATE)",
                new Microsoft.Data.SqlClient.SqlParameter("@From", from),
                new Microsoft.Data.SqlClient.SqlParameter("@To", to))
            .ToListAsync(ct);

        var totalRevenue = dailyBreakdown.Sum(d => d.Revenue);
        var totalOrders = dailyBreakdown.Sum(d => d.Orders);

        return new SalesReportDto
        {
            From = from,
            To = to,
            TotalRevenue = totalRevenue,
            TotalOrders = totalOrders,
            AverageOrderValue = totalOrders > 0
                                ? Math.Round(totalRevenue / totalOrders, 2)
                                : 0,
            DailyBreakdown = dailyBreakdown
        };
    }

    public async Task<StatusSplitReportDto> GetStatusSplitAsync(CancellationToken ct = default)
    {
        var breakdown = await _context.Database
            .SqlQueryRaw<StatusCountRaw>(@"
                SELECT Status, COUNT(*) AS Count
                FROM orders.Orders
                GROUP BY Status")
            .ToListAsync(ct);

        var total = breakdown.Sum(b => b.Count);

        return new StatusSplitReportDto
        {
            TotalOrders = total,
            StatusBreakdown = breakdown.Select(b => new StatusCountDto
            {
                Status = b.Status,
                Count = b.Count,
                Percentage = total > 0
                             ? Math.Round((decimal)b.Count / total * 100, 1)
                             : 0
            }).ToList()
        };
    }

    private class StatusCountRaw
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}