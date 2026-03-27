using System.Security.Claims;
using CapShop.AdminService.Application.DTOs;
using CapShop.AdminService.Domain.Interfaces;
using CapShop.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CapShop.AdminService.Controllers;

[ApiController]
[Route("admin/dashboard")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardRepository _dashboardRepository;

    public DashboardController(IDashboardRepository dashboardRepository)
        => _dashboardRepository = dashboardRepository;

    // GET /admin/dashboard/summary
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<DashboardSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(CancellationToken ct)
    {
        var result = await _dashboardRepository.GetSummaryAsync(ct);
        return Ok(ApiResponse<DashboardSummaryDto>.Ok(result));
    }
}