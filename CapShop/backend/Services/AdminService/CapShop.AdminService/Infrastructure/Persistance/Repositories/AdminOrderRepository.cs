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
                    o.Id,
                    o.OrderNumber,
                    o.UserId,
                    u.Email AS CustomerEmail,
                    o.TotalAmount,
                    o.Status,
                    o.PaymentMethod,
                    o.PlacedAt,
                    COUNT(oi.Id) AS ItemCount
                FROM CapShopOrderDB.orders.Orders o
                LEFT JOIN CapShopAuthDB.auth.Users u ON u.Id = o.UserId
                LEFT JOIN CapShopOrderDB.orders.OrderItems oi ON oi.OrderId = o.Id
                WHERE
                    (@Status = '' OR o.Status = @Status)
                    AND (@Search = '%%' OR o.OrderNumber LIKE @Search OR u.Email LIKE @Search)
                GROUP BY
                    o.Id, o.OrderNumber, o.UserId, u.Email,
                    o.TotalAmount, o.Status, o.PaymentMethod, o.PlacedAt
                ORDER BY o.PlacedAt DESC
                OFFSET {offset} ROWS FETCH NEXT {pageSize} ROWS ONLY",
                new Microsoft.Data.SqlClient.SqlParameter("@Status", statusTerm),
                new Microsoft.Data.SqlClient.SqlParameter("@Search", searchTerm))
            .ToListAsync(ct);

        var totalCount = await _context.Database
            .SqlQueryRaw<int>(@"
                SELECT COUNT(DISTINCT o.Id) AS Value
                FROM CapShopOrderDB.orders.Orders o
                LEFT JOIN CapShopAuthDB.auth.Users u ON u.Id = o.UserId
                WHERE (@Status = '' OR o.Status = @Status)
                  AND (@Search = '%%' OR o.OrderNumber LIKE @Search OR u.Email LIKE @Search)",
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
                    o.TotalAmount, o.Status, o.PaymentMethod,
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
        Guid id, string newStatus, string changedBy, CancellationToken ct = default)
    {
        // Validate allowed transitions
        var currentStatusResult = await _context.Database
            .SqlQueryRaw<string>("SELECT Status AS Value FROM CapShopOrderDB.orders.Orders WHERE Id = @Id",
                new Microsoft.Data.SqlClient.SqlParameter("@Id", id))
            .FirstOrDefaultAsync(ct);

        if (currentStatusResult == null)
            throw new NotFoundException("Order", id);

        var current = currentStatusResult;
        var allowedTransitions = current switch
        {
            "Paid" => new[] { "Packed", "Cancelled" },
            "Packed" => new[] { "Shipped", "Cancelled" },
            "Shipped" => new[] { "Delivered" },
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
            VALUES (@Id, @OrderId, @From, @To, @By, NULL, @Now)",
            new Microsoft.Data.SqlClient.SqlParameter("@Id", Guid.NewGuid()),
            new Microsoft.Data.SqlClient.SqlParameter("@OrderId", id),
            new Microsoft.Data.SqlClient.SqlParameter("@From", current),
            new Microsoft.Data.SqlClient.SqlParameter("@To", newStatus),
            new Microsoft.Data.SqlClient.SqlParameter("@By", changedBy),
            new Microsoft.Data.SqlClient.SqlParameter("@Now", DateTime.UtcNow));
    }
}