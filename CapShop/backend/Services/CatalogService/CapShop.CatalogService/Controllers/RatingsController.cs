using System.Security.Claims;
using CapShop.CatalogService.Application.Commands;
using CapShop.CatalogService.Application.DTOs;
using CapShop.CatalogService.Application.Queries;
using CapShop.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CapShop.CatalogService.Controllers;

/// <summary>
/// Product ratings — submit and retrieve star ratings with optional review text.
/// GET endpoints are public; POST requires a valid JWT (Customer or Admin).
/// </summary>
[ApiController]
[Route("catalog/products/{productId:guid}/ratings")]
[Produces("application/json")]
public class RatingsController : ControllerBase
{
    private readonly SubmitRatingCommandHandler _submitHandler;
    private readonly GetProductRatingsQueryHandler _getHandler;
    private readonly GetRatingAggregateQueryHandler _aggregateHandler;

    public RatingsController(
        SubmitRatingCommandHandler submitHandler,
        GetProductRatingsQueryHandler getHandler,
        GetRatingAggregateQueryHandler aggregateHandler)
    {
        _submitHandler = submitHandler;
        _getHandler = getHandler;
        _aggregateHandler = aggregateHandler;
    }

    // GET /catalog/products/{productId}/ratings
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProductRatingDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRatings(
        Guid productId,
        [FromQuery] int limit = 20,
        CancellationToken ct = default)
    {
        var result = await _getHandler.Handle(new GetProductRatingsQuery(productId, limit), ct);
        return Ok(ApiResponse<IEnumerable<ProductRatingDto>>.Ok(result));
    }

    // GET /catalog/products/{productId}/ratings/aggregate
    [HttpGet("aggregate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<RatingAggregateDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAggregate(Guid productId, CancellationToken ct)
    {
        var result = await _aggregateHandler.Handle(new GetRatingAggregateQuery(productId), ct);
        return Ok(ApiResponse<RatingAggregateDto>.Ok(result));
    }

    // POST /catalog/products/{productId}/ratings
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<ProductRatingDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SubmitRating(
        Guid productId,
        [FromBody] CreateRatingRequestDto request,
        CancellationToken ct)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(ApiResponse<object>.Fail("Invalid token — user ID not found."));

        var userName = User.FindFirstValue(ClaimTypes.Name)
            ?? User.FindFirstValue("name")
            ?? User.FindFirstValue("email")
            ?? "Anonymous";

        if (request.Stars < 1 || request.Stars > 5)
            return BadRequest(ApiResponse<object>.Fail("Stars must be between 1 and 5."));

        var cmd = new SubmitRatingCommand(productId, userId, userName, request.Stars, request.ReviewText);
        var result = await _submitHandler.Handle(cmd, ct);

        return CreatedAtAction(
            nameof(GetRatings),
            new { productId },
            ApiResponse<ProductRatingDto>.Created(result, "Rating submitted successfully."));
    }
}
