using CapShop.AdminService.Application.DTOs;
using CapShop.AdminService.Domain.Interfaces;
using CapShop.Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace CapShop.AdminService.Infrastructure.Persistence.Repositories;

public class AdminOrderRepository : IAdminOrderRepository
{
    private readonly AdminDbContext _context;

    public AdminOrderRepository(AdminDbContext context)
        => _context = context;

    public async Task<AdminPagedResult<AdminOrderSummaryDto>> GetPagedAsync(
        string? search, string? status, int page, int pageSize,
        CancellationToken ct = default)
    {
        var offset = (page - 1) * pageSize;
        var searchTerm = $"%{search ?? ""}%";
        var statusTerm = status ?? "";

        var items = await _context.Database
            .SqlQueryRaw<AdminOrderSummaryDto>($@"
                SELECT
                    src.Id,
                    src.OrderNumber,
                    src.UserId,
                    src.CustomerEmail,
                    src.TotalAmount,
                    src.Status,
                    src.PaymentMethod,
                    src.TransactionId,
                    src.PlacedAt,
                    COUNT(oi.Id) AS ItemCount
                FROM (
                    SELECT
                        o.Id,
                        o.OrderNumber,
                        o.UserId,
                        u.Email AS CustomerEmail,
                        o.TotalAmount,
                        CASE
                            WHEN o.Status = 'PaymentPending'
                                 AND o.PaymentMethod <> 'COD'
                                 AND NULLIF(LTRIM(RTRIM(ISNULL(o.PaymentTransactionId, ''))), '') IS NOT NULL
                                THEN 'Paid'
                            ELSE o.Status
                        END AS Status,
                        o.PaymentMethod,
                        o.PaymentTransactionId AS TransactionId,
                        o.PlacedAt
                    FROM CapShopOrderDB.orders.Orders o
                    LEFT JOIN CapShopAuthDB.auth.Users u ON u.Id = o.UserId
                ) src
                LEFT JOIN CapShopOrderDB.orders.OrderItems oi ON oi.OrderId = src.Id
                WHERE
                    (@Status = '' OR src.Status = @Status)
                    AND (@Search = '%%' OR src.OrderNumber LIKE @Search OR src.CustomerEmail LIKE @Search)
                GROUP BY
                    src.Id, src.OrderNumber, src.UserId, src.CustomerEmail,
                    src.TotalAmount, src.Status, src.PaymentMethod, src.TransactionId, src.PlacedAt
                ORDER BY src.PlacedAt DESC
                OFFSET {offset} ROWS FETCH NEXT {pageSize} ROWS ONLY",
                new Microsoft.Data.SqlClient.SqlParameter("@Status", statusTerm),
                new Microsoft.Data.SqlClient.SqlParameter("@Search", searchTerm))
            .ToListAsync(ct);

        var totalCount = await _context.Database
            .SqlQueryRaw<int>(@"
                SELECT COUNT(*) AS Value
                FROM (
                    SELECT o.Id
                    FROM CapShopOrderDB.orders.Orders o
                    LEFT JOIN CapShopAuthDB.auth.Users u ON u.Id = o.UserId
                    WHERE
                        (@Status = '' OR
                            CASE
                                WHEN o.Status = 'PaymentPending'
                                     AND o.PaymentMethod <> 'COD'
                                     AND NULLIF(LTRIM(RTRIM(ISNULL(o.PaymentTransactionId, ''))), '') IS NOT NULL
                                    THEN 'Paid'
                                ELSE o.Status
                            END = @Status)
                        AND (@Search = '%%' OR o.OrderNumber LIKE @Search OR u.Email LIKE @Search)
                ) AS countedOrders",
                new Microsoft.Data.SqlClient.SqlParameter("@Status", statusTerm),
                new Microsoft.Data.SqlClient.SqlParameter("@Search", searchTerm))
            .FirstOrDefaultAsync(ct);

        return new AdminPagedResult<AdminOrderSummaryDto>(items, totalCount, page, pageSize);
    }

    public async Task<AdminOrderDetailDto?> GetByIdAsync(
        Guid id, CancellationToken ct = default)
    {
        var order = await _context.Database
            .SqlQueryRaw<AdminOrderDetailDto>(@"
                SELECT
                    o.Id, o.OrderNumber, o.UserId,
                    u.Email AS CustomerEmail,
                    o.TotalAmount,
                    CASE
                        WHEN o.Status = 'PaymentPending'
                             AND o.PaymentMethod <> 'COD'
                             AND NULLIF(LTRIM(RTRIM(ISNULL(o.PaymentTransactionId, ''))), '') IS NOT NULL
                            THEN 'Paid'
                        ELSE o.Status
                    END AS Status,
                    o.PaymentMethod,
                    o.PaymentTransactionId AS TransactionId,
                    o.PlacedAt,
                    o.ShipFullName, o.ShipAddressLine,
                    o.ShipCity, o.ShipState, o.ShipPincode
                FROM CapShopOrderDB.orders.Orders o
                LEFT JOIN CapShopAuthDB.auth.Users u ON u.Id = o.UserId
                WHERE o.Id = @Id",
                new Microsoft.Data.SqlClient.SqlParameter("@Id", id))
            .FirstOrDefaultAsync(ct);

        if (order == null) return null;

        // Load order items
        order.Items = await _context.Database
            .SqlQueryRaw<AdminOrderItemDto>(@"
                SELECT ProductId, ProductName, Quantity, UnitPrice,
                       CAST(Quantity * UnitPrice AS decimal(18,2)) AS LineTotal
                FROM CapShopOrderDB.orders.OrderItems
                WHERE OrderId = @OrderId",
                new Microsoft.Data.SqlClient.SqlParameter("@OrderId", id))
            .ToListAsync(ct);

        // Load status history
        order.History = await _context.Database
            .SqlQueryRaw<StatusHistoryDto>(@"
                SELECT FromStatus, ToStatus, ChangedBy, Remarks, ChangedAt
                FROM CapShopOrderDB.orders.OrderStatusHistory
                WHERE OrderId = @OrderId
                ORDER BY ChangedAt ASC",
                new Microsoft.Data.SqlClient.SqlParameter("@OrderId", id))
            .ToListAsync(ct);

        return order;
    }

    public async Task UpdateStatusAsync(
        Guid id, string newStatus, string changedBy, string? remarks, CancellationToken ct = default)
    {
        // Validate allowed transitions
        var currentOrder = await _context.Database
            .SqlQueryRaw<OrderStateRow>(@"
                SELECT
                    Status,
                    PaymentMethod,
                    PaymentTransactionId
                FROM CapShopOrderDB.orders.Orders
                WHERE Id = @Id",
                new Microsoft.Data.SqlClient.SqlParameter("@Id", id))
            .FirstOrDefaultAsync(ct);

        if (currentOrder == null)
            throw new NotFoundException("Order", id);

        var current = currentOrder.Status;
        var paymentMethod = currentOrder.PaymentMethod;
        var hasCapturedOnlinePayment =
            !string.Equals(paymentMethod, "COD", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(currentOrder.PaymentTransactionId);

        if (current == "PaymentPending" && hasCapturedOnlinePayment)
        {
            await _context.Database.ExecuteSqlRawAsync(@"
                UPDATE CapShopOrderDB.orders.Orders
                SET Status = 'Paid', UpdatedAt = @Now
                WHERE Id = @Id AND Status = 'PaymentPending'",
                new Microsoft.Data.SqlClient.SqlParameter("@Id", id),
                new Microsoft.Data.SqlClient.SqlParameter("@Now", DateTime.UtcNow));

            await _context.Database.ExecuteSqlRawAsync(@"
                INSERT INTO CapShopOrderDB.orders.OrderStatusHistory
                    (Id, OrderId, FromStatus, ToStatus, ChangedBy, Remarks, ChangedAt)
                VALUES (@Id, @OrderId, @From, @To, @By, @Remarks, @Now)",
                new Microsoft.Data.SqlClient.SqlParameter("@Id", Guid.NewGuid()),
                new Microsoft.Data.SqlClient.SqlParameter("@OrderId", id),
                new Microsoft.Data.SqlClient.SqlParameter("@From", "PaymentPending"),
                new Microsoft.Data.SqlClient.SqlParameter("@To", "Paid"),
                new Microsoft.Data.SqlClient.SqlParameter("@By", "system:payment-sync"),
                new Microsoft.Data.SqlClient.SqlParameter("@Remarks", "Backfilled paid status for a successful online payment."),
                new Microsoft.Data.SqlClient.SqlParameter("@Now", DateTime.UtcNow));

            current = "Paid";
        }

        var isCod = string.Equals(paymentMethod, "COD", StringComparison.OrdinalIgnoreCase);

        var allowedTransitions = current switch
        {
            "PaymentPending" when isCod => new[] { "Paid", "Cancelled", "PaymentFailed" },
            "Paid" => new[] { "Packed", "Cancelled" },
            "Packed" => new[] { "Shipped", "Cancelled" },
            "Shipped" => new[] { "Delivered" },
            "PaymentFailed" when isCod => new[] { "PaymentPending", "Cancelled" },
            _ => Array.Empty<string>()
        };

        if (!allowedTransitions.Contains(newStatus))
            throw new DomainException(
                $"Cannot transition order from '{current}' to '{newStatus}'. " +
                $"Allowed: {string.Join(", ", allowedTransitions)}.");

        // Update status in orders schema
        await _context.Database.ExecuteSqlRawAsync(@"
            UPDATE CapShopOrderDB.orders.Orders
            SET Status = @NewStatus, UpdatedAt = @Now
            WHERE Id = @Id",
            new Microsoft.Data.SqlClient.SqlParameter("@Id", id),
            new Microsoft.Data.SqlClient.SqlParameter("@NewStatus", newStatus),
            new Microsoft.Data.SqlClient.SqlParameter("@Now", DateTime.UtcNow));

        // Append to status history
        await _context.Database.ExecuteSqlRawAsync(@"
            INSERT INTO CapShopOrderDB.orders.OrderStatusHistory
                (Id, OrderId, FromStatus, ToStatus, ChangedBy, Remarks, ChangedAt)
            VALUES (@Id, @OrderId, @From, @To, @By, @Remarks, @Now)",
            new Microsoft.Data.SqlClient.SqlParameter("@Id", Guid.NewGuid()),
            new Microsoft.Data.SqlClient.SqlParameter("@OrderId", id),
            new Microsoft.Data.SqlClient.SqlParameter("@From", current),
            new Microsoft.Data.SqlClient.SqlParameter("@To", newStatus),
            new Microsoft.Data.SqlClient.SqlParameter("@By", changedBy),
            new Microsoft.Data.SqlClient.SqlParameter("@Remarks", (object?)remarks ?? DBNull.Value),
            new Microsoft.Data.SqlClient.SqlParameter("@Now", DateTime.UtcNow));
    }

    private sealed class OrderStateRow
    {
        public string Status { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public string? PaymentTransactionId { get; set; }
    }
}
