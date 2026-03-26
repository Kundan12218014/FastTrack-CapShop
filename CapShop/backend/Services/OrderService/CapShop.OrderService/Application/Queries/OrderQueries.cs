using CapShop.OrderService.Application.Commands;
using CapShop.OrderService.Application.DTOs;
using CapShop.OrderService.Domain.Entities;
using CapShop.OrderService.Domain.Interfaces;
using CapShop.Shared.Exceptions;
using CapShop.Shared.Models;

namespace CapShop.OrderService.Application.Queries;

// ── Get Cart ──────────────────────────────────────────────────────────────

public record GetCartQuery(Guid UserId);

public class GetCartQueryHandler
{
    private readonly ICartRepository _cartRepository;

    public GetCartQueryHandler(ICartRepository cartRepository)
        => _cartRepository = cartRepository;

    public async Task<CartDto> Handle(GetCartQuery query, CancellationToken ct = default)
    {
        var cart = await _cartRepository.GetActiveCartByUserIdAsync(query.UserId, ct);

        // Return empty cart if none exists — don't throw 404
        if (cart == null)
            return new CartDto
            {
                Id = Guid.Empty,
                Status = CartStatus.Active,
                Items = [],
                Total = 0,
                ItemCount = 0
            };

        return MapCartToDto(cart);
    }

    private static CartDto MapCartToDto(Cart cart) => new()
    {
        Id = cart.Id,
        Status = cart.Status,
        Total = cart.Total,
        ItemCount = cart.Items.Sum(i => i.Quantity),
        Items = cart.Items.Select(i => new CartItemDto
        {
            Id = i.Id,
            ProductId = i.ProductId,
            ProductName = i.ProductName,
            UnitPrice = i.UnitPrice,
            Quantity = i.Quantity,
            LineTotal = i.LineTotal
        }).ToList()
    };
}

// ── Get My Orders ─────────────────────────────────────────────────────────

public record GetMyOrdersQuery(Guid UserId, int Page = 1, int PageSize = 10);

public class GetMyOrdersQueryHandler
{
    private readonly IOrderRepository _orderRepository;

    public GetMyOrdersQueryHandler(IOrderRepository orderRepository)
        => _orderRepository = orderRepository;

    public async Task<PagedResult<OrderSummaryDto>> Handle(
        GetMyOrdersQuery query,
        CancellationToken ct = default)
    {
        var paged = await _orderRepository.GetByUserIdAsync(
            query.UserId, query.Page, query.PageSize, ct);

        var dtos = paged.Items.Select(o => new OrderSummaryDto
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber,
            TotalAmount = o.TotalAmount,
            Status = o.Status.ToString(),
            PlacedAt = o.PlacedAt,
            ItemCount = o.Items.Sum(i => i.Quantity)
        });

        return new PagedResult<OrderSummaryDto>(
            dtos, paged.TotalCount, paged.Page, paged.PageSize);
    }
}

// ── Get Order By Id ───────────────────────────────────────────────────────

public record GetOrderByIdQuery(Guid OrderId, Guid UserId);

public class GetOrderByIdQueryHandler
{
    private readonly IOrderRepository _orderRepository;

    public GetOrderByIdQueryHandler(IOrderRepository orderRepository)
        => _orderRepository = orderRepository;

    public async Task<OrderDto> Handle(
        GetOrderByIdQuery query,
        CancellationToken ct = default)
    {
        var order = await _orderRepository.GetByIdAsync(query.OrderId, ct)
            ?? throw new NotFoundException("Order", query.OrderId);

        // Customers can only view their own orders
        if (order.UserId != query.UserId)
            throw new ForbiddenException("You can only view your own orders.");

        return PlaceOrderCommandHandler.MapToDto(order);
    }
}