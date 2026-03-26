using System.Security.Claims;
using CapShop.OrderService.Application.Commands;
using CapShop.OrderService.Application.DTOs;
using CapShop.OrderService.Application.Queries;
using CapShop.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CapShop.OrderService.Controllers;

[ApiController]
[Route("orders")]
[Authorize]
[Produces("application/json")]
public class OrdersController : ControllerBase
{
    private readonly SimulatePaymentCommandHandler _simulatePaymentHandler;
    private readonly PlaceOrderCommandHandler _placeOrderHandler;
    private readonly CancelOrderCommandHandler _cancelOrderHandler;
    private readonly GetMyOrdersQueryHandler _getMyOrdersHandler;
    private readonly GetOrderByIdQueryHandler _getOrderByIdHandler;

    public OrdersController(
        SimulatePaymentCommandHandler simulatePaymentHandler,
        PlaceOrderCommandHandler placeOrderHandler,
        CancelOrderCommandHandler cancelOrderHandler,
        GetMyOrdersQueryHandler getMyOrdersHandler,
        GetOrderByIdQueryHandler getOrderByIdHandler)
    {
        _simulatePaymentHandler = simulatePaymentHandler;
        _placeOrderHandler = placeOrderHandler;
        _cancelOrderHandler = cancelOrderHandler;
        _getMyOrdersHandler = getMyOrdersHandler;
        _getOrderByIdHandler = getOrderByIdHandler;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue("userId")
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID not found in token."));

    // POST /orders/payment/simulate
    [HttpPost("payment/simulate")]
    [ProducesResponseType(typeof(ApiResponse<PaymentSimulationResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SimulatePayment(
        [FromBody] SimulatePaymentRequestDto request,
        CancellationToken ct)
    {
        var command = new SimulatePaymentCommand(CurrentUserId, request.PaymentMethod);
        var result = await _simulatePaymentHandler.Handle(command, ct);
        return Ok(ApiResponse<PaymentSimulationResponseDto>.Ok(result));
    }

    // POST /orders/place
    [HttpPost("place")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PlaceOrder(
        [FromBody] PlaceOrderRequestDto request,
        CancellationToken ct)
    {
        var command = new PlaceOrderCommand(
            CurrentUserId,
            request.ShippingAddress,
            request.PaymentMethod,
            request.TransactionId);

        var result = await _placeOrderHandler.Handle(command, ct);
        return StatusCode(201, ApiResponse<OrderDto>.Created(result, "Order placed successfully."));
    }

    // GET /orders/my
    [HttpGet("my")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<OrderSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await _getMyOrdersHandler.Handle(
            new GetMyOrdersQuery(CurrentUserId, page, pageSize), ct);

        return Ok(ApiResponse<PagedResult<OrderSummaryDto>>.Ok(result));
    }

    // GET /orders/{id}
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetOrderById(Guid id, CancellationToken ct)
    {
        var result = await _getOrderByIdHandler.Handle(
            new GetOrderByIdQuery(id, CurrentUserId), ct);

        return Ok(ApiResponse<OrderDto>.Ok(result));
    }

    // POST /orders/{id}/cancel
    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CancelOrder(
        Guid id,
        [FromBody] CancelOrderRequestDto request,
        CancellationToken ct)
    {
        await _cancelOrderHandler.Handle(
            new CancelOrderCommand(id, CurrentUserId, request.Reason), ct);

        return NoContent();
    }
}