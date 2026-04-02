using CapShop.AdminService.Application.DTOs;
using CapShop.AdminService.Application.Services;
using CapShop.AdminService.Domain.Interfaces;
using CapShop.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CapShop.AdminService.Controllers;

/// <summary>
/// Reports controller — sales analytics and order status breakdown.
/// All endpoints require the Admin role.
/// Export endpoints return file downloads (CSV / HTML).
/// </summary>
[ApiController]
[Route("admin/reports")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
public class ReportsController : ControllerBase
{
    private readonly IReportsRepository _reportsRepository;
    private readonly ReportExportService _exportService;

    public ReportsController(
        IReportsRepository reportsRepository,
        ReportExportService exportService)
    {
        _reportsRepository = reportsRepository;
        _exportService = exportService;
    }

    // GET /admin/reports/sales?from=2024-01-01&to=2024-01-31
    [HttpGet("sales")]
    [ProducesResponseType(typeof(ApiResponse<SalesReportDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSalesReport(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct)
    {
        var start = from?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-30);
        var end   = to?.ToUniversalTime()   ?? DateTime.UtcNow;

        if (start > end)
            return BadRequest(ApiResponse<object>.Fail("'from' date must be before 'to' date."));

        var report = await _reportsRepository.GetSalesReportAsync(start, end, ct);
        return Ok(ApiResponse<SalesReportDto>.Ok(report));
    }

    // GET /admin/reports/status-split
    [HttpGet("status-split")]
    [ProducesResponseType(typeof(ApiResponse<StatusSplitReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatusSplit(CancellationToken ct)
    {
        var report = await _reportsRepository.GetStatusSplitAsync(ct);
        return Ok(ApiResponse<StatusSplitReportDto>.Ok(report));
    }

    // GET /admin/reports/sales/export/csv?from=2024-01-01&to=2024-01-31
    [HttpGet("sales/export/csv")]
    [Produces("text/csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportSalesCsv(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct)
    {
        var start = from?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-30);
        var end   = to?.ToUniversalTime()   ?? DateTime.UtcNow;

        var report = await _reportsRepository.GetSalesReportAsync(start, end, ct);
        var bytes  = _exportService.GenerateSalesCsv(report);
        var filename = $"sales-report-{start:yyyyMMdd}-{end:yyyyMMdd}.csv";

        return File(bytes, "text/csv", filename);
    }

    // GET /admin/reports/sales/export/html?from=2024-01-01&to=2024-01-31
    [HttpGet("sales/export/html")]
    [Produces("text/html")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportSalesHtml(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct)
    {
        var start = from?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-30);
        var end   = to?.ToUniversalTime()   ?? DateTime.UtcNow;

        var report  = await _reportsRepository.GetSalesReportAsync(start, end, ct);
        var bytes   = _exportService.GenerateSalesHtml(report);
        var filename = $"sales-report-{start:yyyyMMdd}-{end:yyyyMMdd}.html";

        return File(bytes, "text/html", filename);
    }

    // GET /admin/reports/status-split/export/csv
    [HttpGet("status-split/export/csv")]
    [Produces("text/csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportStatusSplitCsv(CancellationToken ct)
    {
        var report  = await _reportsRepository.GetStatusSplitAsync(ct);
        var bytes   = _exportService.GenerateStatusSplitCsv(report);
        var filename = $"status-split-{DateTime.UtcNow:yyyyMMdd}.csv";

        return File(bytes, "text/csv", filename);
    }
}
