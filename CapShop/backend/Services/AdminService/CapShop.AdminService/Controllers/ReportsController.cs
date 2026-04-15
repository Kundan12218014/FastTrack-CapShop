using System.Security.Claims;
using System.Text;
using CapShop.AdminService.Application.DTOs;
using CapShop.AdminService.Domain.Interfaces;
using CapShop.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CapShop.AdminService.Controllers;

[ApiController]
[Route("admin/reports")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
public class ReportsController : ControllerBase
{
    private readonly IReportsRepository _reportsRepository;

    public ReportsController(IReportsRepository reportsRepository)
        => _reportsRepository = reportsRepository;

    // GET /admin/reports/sales?from=2026-01-01&to=2026-12-31
    [HttpGet("sales")]
    [ProducesResponseType(typeof(ApiResponse<SalesReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesReport(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to   = null,
        CancellationToken ct = default)
    {
        var fromDate = (from ?? DateTime.UtcNow.AddDays(-30)).Date;
        var toDate   = (to   ?? DateTime.UtcNow).Date.AddDays(1).AddSeconds(-1); // inclusive end

        var report = await _reportsRepository.GetSalesReportAsync(fromDate, toDate, ct);
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

    // GET /admin/reports/sales/export/csv
    [HttpGet("sales/export/csv")]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to   = null,
        CancellationToken ct = default)
    {
        var fromDate = (from ?? DateTime.UtcNow.AddDays(-30)).Date;
        var toDate   = (to   ?? DateTime.UtcNow).Date.AddDays(1).AddSeconds(-1);

        var report = await _reportsRepository.GetSalesReportAsync(fromDate, toDate, ct);

        var sb = new StringBuilder();
        sb.AppendLine("Date,Revenue,Orders");
        foreach (var d in report.DailyBreakdown)
            sb.AppendLine($"{d.Date:yyyy-MM-dd},{d.Revenue},{d.Orders}");

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", $"sales-report-{fromDate:yyyyMMdd}-{toDate:yyyyMMdd}.csv");
    }

    // GET /admin/reports/sales/export/pdf  (returns CSV as fallback — PDF needs a library)
    [HttpGet("sales/export/pdf")]
    public async Task<IActionResult> ExportPdf(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to   = null,
        CancellationToken ct = default)
    {
        // Redirect to CSV export — PDF generation requires a 3rd-party lib
        var fromStr = (from ?? DateTime.UtcNow.AddDays(-30)).ToString("yyyy-MM-dd");
        var toStr   = (to   ?? DateTime.UtcNow).ToString("yyyy-MM-dd");
        return RedirectToAction(nameof(ExportCsv), new { from = fromStr, to = toStr });
    }
}
