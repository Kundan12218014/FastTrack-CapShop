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
[Route("admin/products")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
public class AdminProductsController : ControllerBase
{
    private readonly IAdminProductRepository _productRepository;
    private readonly IAuditLogRepository _auditRepository;

    public AdminProductsController(
        IAdminProductRepository productRepository,
        IAuditLogRepository auditRepository)
    {
        _productRepository = productRepository;
        _auditRepository = auditRepository;
    }

    private string AdminId => User.FindFirstValue("userId")
                           ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                           ?? "unknown";

    // GET /admin/products
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<AdminPagedResult<AdminProductDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? search = null,
        [FromQuery] bool includeInactive = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _productRepository.GetPagedAsync(search, includeInactive, page, pageSize, ct);
        return Ok(ApiResponse<AdminPagedResult<AdminProductDto>>.Ok(result));
    }

    // GET /admin/products/{id}
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AdminProductDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var product = await _productRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Product", id);

        return Ok(ApiResponse<AdminProductDto>.Ok(product));
    }

    // POST /admin/products
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateProduct(
        [FromBody] CreateProductDto dto,
        CancellationToken ct)
    {
        await _productRepository.CreateAsync(dto, ct);

        await LogAuditAsync("CREATE", "Product", null,
            $"Created product: {dto.Name}, Price: {dto.Price}", ct);

        return StatusCode(201, ApiResponse<object>.Created(null, "Product created successfully."));
    }

    // PUT /admin/products/{id}
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProduct(
        Guid id,
        [FromBody] UpdateProductDto dto,
        CancellationToken ct)
    {
        var existing = await _productRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Product", id);

        await _productRepository.UpdateAsync(id, dto, ct);

        await LogAuditAsync("UPDATE", "Product", id.ToString(),
            $"Updated product: {dto.Name}", ct);

        return Ok(ApiResponse<object>.Ok(null, "Product updated successfully."));
    }

    // PUT /admin/products/{id}/stock
    [HttpPut("{id:guid}/stock")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStock(
        Guid id,
        [FromBody] UpdateStockDto dto,
        CancellationToken ct)
    {
        var existing = await _productRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Product", id);

        await _productRepository.UpdateStockAsync(id, dto.Quantity, ct);

        await LogAuditAsync("UPDATE_STOCK", "Product", id.ToString(),
            $"Stock updated to {dto.Quantity}", ct);

        return Ok(ApiResponse<object>.Ok(null, $"Stock updated to {dto.Quantity}."));
    }

    // PATCH /admin/products/{id}/status
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetActive(
        Guid id,
        [FromBody] SetProductActiveDto dto,
        CancellationToken ct)
    {
        var existing = await _productRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Product", id);

        await _productRepository.SetActiveAsync(id, dto.IsActive, ct);

        await LogAuditAsync(
            dto.IsActive ? "ACTIVATE" : "DEACTIVATE",
            "Product", id.ToString(), null, ct);

        return Ok(ApiResponse<object>.Ok(null,
            $"Product {(dto.IsActive ? "activated" : "deactivated")} successfully."));
    }

    // DELETE /admin/products/{id}  — permanent delete
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(Guid id, CancellationToken ct)
    {
        var existing = await _productRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Product", id);

        await _productRepository.DeleteAsync(id, ct);

        await LogAuditAsync("DELETE", "Product", id.ToString(), "Soft deleted.", ct);

        return NoContent();
    }

    private async Task LogAuditAsync(
        string action, string entityType, string? entityId,
        string? details, CancellationToken ct)
    {
        var log = AuditLog.Create(AdminId, action, entityType, entityId, details);
        await _auditRepository.AddAsync(log, ct);
        await _auditRepository.SaveChangesAsync(ct);
    }
}
