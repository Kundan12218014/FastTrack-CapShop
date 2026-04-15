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
                    CAST(src.PlacedAt AS DATE) AS Date,
                    ISNULL(SUM(src.TotalAmount), 0) AS Revenue,
                    COUNT(*) AS Orders
                FROM (
                    SELECT
                        o.TotalAmount,
                        o.PlacedAt,
                        CASE
                            WHEN o.Status = 'PaymentPending'
                                 AND o.PaymentMethod <> 'COD'
                                 AND NULLIF(LTRIM(RTRIM(ISNULL(o.PaymentTransactionId, ''))), '') IS NOT NULL
                                THEN 'Paid'
                            ELSE o.Status
                        END AS EffectiveStatus
                    FROM CapShopOrderDB.orders.Orders o
                ) src
                WHERE src.EffectiveStatus IN ('Paid','Packed','Shipped','Delivered')
                  AND src.PlacedAt >= @From AND src.PlacedAt <= @To
                GROUP BY CAST(src.PlacedAt AS DATE)
                ORDER BY CAST(src.PlacedAt AS DATE)",
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
                SELECT
                    CASE
                        WHEN o.Status = 'PaymentPending'
                             AND o.PaymentMethod <> 'COD'
                             AND NULLIF(LTRIM(RTRIM(ISNULL(o.PaymentTransactionId, ''))), '') IS NOT NULL
                            THEN 'Paid'
                        ELSE o.Status
                    END AS Status,
                    COUNT(*) AS Count
                FROM CapShopOrderDB.orders.Orders o
                GROUP BY
                    CASE
                        WHEN o.Status = 'PaymentPending'
                             AND o.PaymentMethod <> 'COD'
                             AND NULLIF(LTRIM(RTRIM(ISNULL(o.PaymentTransactionId, ''))), '') IS NOT NULL
                            THEN 'Paid'
                        ELSE o.Status
                    END")
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
