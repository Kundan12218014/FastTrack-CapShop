using System.ComponentModel.DataAnnotations;

namespace CapShop.AdminService.Application.DTOs;

// ── SHARED PAGINATION ─────────────────────────────────────────────────────

public class AdminPagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

    public AdminPagedResult() { }

    public AdminPagedResult(IEnumerable<T> items, int totalCount, int page, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        Page = page;
        PageSize = pageSize;
    }
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────

public class DashboardSummaryDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int TotalCustomers { get; set; }
    public int PendingOrders { get; set; }
    public int TotalProducts { get; set; }
    public int LowStockProducts { get; set; }
    public decimal RevenueToday { get; set; }
    public int OrdersToday { get; set; }
    public List<RecentOrderDto> RecentOrders { get; set; } = [];
}

public class RecentOrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime PlacedAt { get; set; }
}

// ── PRODUCT MANAGEMENT ────────────────────────────────────────────────────

public class AdminProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public string StockStatus { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateProductDto
{
    [Required(ErrorMessage = "Product name is required.")]
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than zero.")]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Stock quantity cannot be negative.")]
    public int StockQuantity { get; set; }

    [Required(ErrorMessage = "Category is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "Please select a valid category.")]
    public int CategoryId { get; set; }

    [StringLength(500)]
    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateProductDto
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than zero.")]
    public decimal Price { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Please select a valid category.")]
    public int CategoryId { get; set; }

    [StringLength(500)]
    public string? ImageUrl { get; set; }
}

public class UpdateStockDto
{
    [Range(0, int.MaxValue, ErrorMessage = "Stock quantity cannot be negative.")]
    public int Quantity { get; set; }
}

public class SetProductActiveDto
{
    public bool IsActive { get; set; }
}

// ── ORDER MANAGEMENT ──────────────────────────────────────────────────────

public class AdminOrderSummaryDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string CustomerEmail { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public DateTime PlacedAt { get; set; }
    public int ItemCount { get; set; }
}

public class AdminOrderDetailDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string CustomerEmail { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public DateTime PlacedAt { get; set; }
    public string ShipFullName { get; set; } = string.Empty;
    public string ShipAddressLine { get; set; } = string.Empty;
    public string ShipCity { get; set; } = string.Empty;
    public string ShipState { get; set; } = string.Empty;
    public string ShipPincode { get; set; } = string.Empty;
    public List<AdminOrderItemDto> Items { get; set; } = [];
    public List<StatusHistoryDto> History { get; set; } = [];
}

public class AdminOrderItemDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

public class StatusHistoryDto
{
    public string? FromStatus { get; set; }
    public string ToStatus { get; set; } = string.Empty;
    public string ChangedBy { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public DateTime ChangedAt { get; set; }
}

public class UpdateOrderStatusDto
{
    [Required(ErrorMessage = "New status is required.")]
    public string NewStatus { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Remarks { get; set; }
}

// ── REPORTS ───────────────────────────────────────────────────────────────

public class SalesReportDto
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public decimal AverageOrderValue { get; set; }
    public List<DailySalesDto> DailyBreakdown { get; set; } = [];
}

public class DailySalesDto
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}

public class StatusSplitReportDto
{
    public int TotalOrders { get; set; }
    public List<StatusCountDto> StatusBreakdown { get; set; } = [];
}

public class StatusCountDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}
