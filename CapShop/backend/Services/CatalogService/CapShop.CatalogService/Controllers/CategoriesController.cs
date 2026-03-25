using CapShop.CatalogService.Application.DTOs;
using CapShop.CatalogService.Application.Queries;
using CapShop.Shared.Models;
using Microsoft.AspNetCore.Mvc;

namespace CapShop.CatalogService.Controllers;

[ApiController]
[Route("catalog/categories")]
[Produces("application/json")]
public class CategoriesController : ControllerBase
{
    private readonly GetCategoriesQueryHandler _getCategoriesHandler;

    public CategoriesController(GetCategoriesQueryHandler getCategoriesHandler)
        => _getCategoriesHandler = getCategoriesHandler;

    // GET /catalog/categories
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CategoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories(CancellationToken ct)
    {
        var result = await _getCategoriesHandler.Handle(new GetCategoriesQuery(), ct);
        return Ok(ApiResponse<IEnumerable<CategoryDto>>.Ok(result));
    }
}