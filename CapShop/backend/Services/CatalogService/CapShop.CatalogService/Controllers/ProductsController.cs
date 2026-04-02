using CapShop.CatalogService.Application.DTOs;
using CapShop.CatalogService.Application.Queries;
using CapShop.Shared.Models;
using Microsoft.AspNetCore.Mvc;

namespace CapShop.CatalogService.Controllers;

/// <summary>
/// Products controller — public read endpoints.
/// No [Authorize] needed — catalog browsing is open to everyone.
/// Admin product CRUD lives in CapShop.AdminService.
/// </summary>
[ApiController]
[Route("catalog/products")]
[Produces("application/json")]
public class ProductsController : ControllerBase
{
    private readonly GetProductsQueryHandler _getProductsHandler;
    private readonly GetProductByIdQueryHandler _getByIdHandler;
    private readonly GetFeaturedProductsQueryHandler _getFeaturedHandler;

    public ProductsController(
        GetProductsQueryHandler getProductsHandler,
        GetProductByIdQueryHandler getByIdHandler,
        GetFeaturedProductsQueryHandler getFeaturedHandler)
    {
        _getProductsHandler = getProductsHandler;
        _getByIdHandler = getByIdHandler;
        _getFeaturedHandler = getFeaturedHandler;
    }

    // GET /catalog/products?query=shirt&categoryId=2&minPrice=100&maxPrice=500&sortBy=price_asc&page=1&pageSize=12
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ProductDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? query = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string sortBy = "name",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
    {
        var queryObj = new GetProductsQuery(
            query, categoryId, minPrice, maxPrice, sortBy, page, pageSize);

        var result = await _getProductsHandler.Handle(queryObj, ct);

        return Ok(ApiResponse<PagedResult<ProductDto>>.Ok(result));
    }

    // GET /catalog/products/featured
    // NOTE: This route must be defined BEFORE {id:guid} to avoid
    // "featured" being treated as a Guid and returning 400.
    [HttpGet("featured")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProductDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFeatured(
        [FromQuery] int count = 8,
        CancellationToken ct = default)
    {
        var result = await _getFeaturedHandler.Handle(
            new GetFeaturedProductsQuery(count), ct);

        return Ok(ApiResponse<IEnumerable<ProductDto>>.Ok(result));
    }

    // GET /catalog/products/{id}
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ProductDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _getByIdHandler.Handle(
            new GetProductByIdQuery(id), ct);

        return Ok(ApiResponse<ProductDto>.Ok(result));
    }
}