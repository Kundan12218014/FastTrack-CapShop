using System.Security.Claims;
using CapShop.AdminService.Application.DTOs;
using CapShop.AdminService.Domain.Entities;
using CapShop.AdminService.Domain.Interfaces;
using CapShop.Shared.Exceptions;
using CapShop.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CapShop.AdminService.Controllers;

[ApiController]
[Route("admin/orders")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
public class AdminOrdersController : ControllerBase
{
    private readonly IAdminOrderRepository _orderRepository;
    private readonly IAuditLogRepository _auditRepository;

    public AdminOrdersController(
        IAdminOrderRepository orderRepository,
        IAuditLogRepository auditRepository)
    {
        _orderRepository = orderRepository;
        _auditRepository = auditRepository;
    }

    private string AdminId => User.FindFirstValue("userId")
                           ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                           ?? "unknown";

    // GET /admin/orders
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<AdminPagedResult<AdminOrderSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrders(
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _orderRepository.GetPagedAsync(search, status, page, pageSize, ct);
        return Ok(ApiResponse<AdminPagedResult<AdminOrderSummaryDto>>.Ok(result));
    }

    // GET /admin/orders/{id}
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AdminOrderDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var order = await _orderRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Order", id);

        return Ok(ApiResponse<AdminOrderDetailDto>.Ok(order));
    }

    // PUT /admin/orders/{id}/status
    [HttpPut("{id:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateOrderStatusDto dto,
        CancellationToken ct)
    {
        await _orderRepository.UpdateStatusAsync(id, dto.NewStatus, AdminId, ct);

        var log = AuditLog.Create(
            AdminId, "UPDATE_ORDER_STATUS", "Order",
            id.ToString(), $"Status changed to {dto.NewStatus}. Remarks: {dto.Remarks}");

        await _auditRepository.AddAsync(log, ct);
        await _auditRepository.SaveChangesAsync(ct);

        return Ok(ApiResponse<object>.Ok(null,
            $"Order status updated to '{dto.NewStatus}' successfully."));
    }
}