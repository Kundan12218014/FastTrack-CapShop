using System.Security.Claims;
using CapShop.OrderService.Application.Commands;
using CapShop.OrderService.Application.DTOs;
using CapShop.OrderService.Application.Queries;
using CapShop.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CapShop.OrderService.Controllers;

[ApiController]
[Route("orders/cart")]
[Authorize]
[Produces("application/json")]
public class CartController : ControllerBase
{
    private readonly GetCartQueryHandler _getCartHandler;
    private readonly AddToCartCommandHandler _addToCartHandler;
    private readonly UpdateCartItemCommandHandler _updateItemHandler;
    private readonly RemoveCartItemCommandHandler _removeItemHandler;

    public CartController(
        GetCartQueryHandler getCartHandler,
        AddToCartCommandHandler addToCartHandler,
        UpdateCartItemCommandHandler updateItemHandler,
        RemoveCartItemCommandHandler removeItemHandler)
    {
        _getCartHandler = getCartHandler;
        _addToCartHandler = addToCartHandler;
        _updateItemHandler = updateItemHandler;
        _removeItemHandler = removeItemHandler;
    }

    // Reads the UserId from the JWT claims — no need to pass it in the URL
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue("userId")
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID not found in token."));

    // GET /orders/cart
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<CartDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCart(CancellationToken ct)
    {
        var result = await _getCartHandler.Handle(new GetCartQuery(CurrentUserId), ct);
        return Ok(ApiResponse<CartDto>.Ok(result));
    }

    // POST /orders/cart/items
    [HttpPost("items")]
    [ProducesResponseType(typeof(ApiResponse<CartItemDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddItem(
        [FromBody] AddToCartRequestDto request,
        CancellationToken ct)
    {
        var command = new AddToCartCommand(
            CurrentUserId,
            request.ProductId,
            request.ProductName,
            request.UnitPrice,
            request.Quantity,
            request.AvailableStock);

        var result = await _addToCartHandler.Handle(command, ct);
        return StatusCode(201, ApiResponse<CartItemDto>.Created(result));
    }

    // PUT /orders/cart/items/{itemId}
    [HttpPut("items/{itemId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateItem(
        Guid itemId,
        [FromBody] UpdateCartItemRequestDto request,
        CancellationToken ct)
    {
        var command = new UpdateCartItemCommand(
            CurrentUserId, itemId, request.Quantity, request.AvailableStock);

        await _updateItemHandler.Handle(command, ct);
        return NoContent();
    }

    // DELETE /orders/cart/items/{itemId}
    [HttpDelete("items/{itemId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveItem(Guid itemId, CancellationToken ct)
    {
        await _removeItemHandler.Handle(new RemoveCartItemCommand(CurrentUserId, itemId), ct);
        return NoContent();
    }
}
