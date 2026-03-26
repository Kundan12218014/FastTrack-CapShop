using CapShop.OrderService.Application.DTOs;
using CapShop.OrderService.Domain.Entities;
using CapShop.OrderService.Domain.Interfaces;
using CapShop.Shared.Exceptions;

namespace CapShop.OrderService.Application.Commands;

// ── Add to Cart ───────────────────────────────────────────────────────────

public record AddToCartCommand(
    Guid UserId,
    Guid ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity,
    int AvailableStock);

public class AddToCartCommandHandler
{
    private readonly ICartRepository _cartRepository;

    public AddToCartCommandHandler(ICartRepository cartRepository)
        => _cartRepository = cartRepository;

    public async Task<CartItemDto> Handle(
        AddToCartCommand command,
        CancellationToken ct = default)
    {
        // Get existing active cart or create a new one
        var cart = await _cartRepository.GetActiveCartByUserIdAsync(command.UserId, ct)
                   ?? Cart.Create(command.UserId);

        var isNewCart = cart.Id == Guid.Empty
                     || !await CartExistsAsync(cart.Id, ct);

        var item = cart.AddItem(
            command.ProductId,
            command.ProductName,
            command.UnitPrice,
            command.Quantity,
            command.AvailableStock);

        if (isNewCart)
            await _cartRepository.AddAsync(cart, ct);

        await _cartRepository.SaveChangesAsync(ct);

        return new CartItemDto
        {
            Id = item.Id,
            ProductId = item.ProductId,
            ProductName = item.ProductName,
            UnitPrice = item.UnitPrice,
            Quantity = item.Quantity,
            LineTotal = item.LineTotal
        };
    }

    // Helper — checks if the cart already exists in DB
    private async Task<bool> CartExistsAsync(Guid cartId, CancellationToken ct)
    {
        var existing = await _cartRepository.GetByIdAsync(cartId, ct);
        return existing != null;
    }
}

// ── Update Cart Item ──────────────────────────────────────────────────────

public record UpdateCartItemCommand(
    Guid UserId,
    Guid CartItemId,
    int NewQuantity,
    int AvailableStock);

public class UpdateCartItemCommandHandler
{
    private readonly ICartRepository _cartRepository;

    public UpdateCartItemCommandHandler(ICartRepository cartRepository)
        => _cartRepository = cartRepository;

    public async Task Handle(UpdateCartItemCommand command, CancellationToken ct = default)
    {
        var cart = await _cartRepository.GetActiveCartByUserIdAsync(command.UserId, ct)
            ?? throw new NotFoundException("Active cart", command.UserId);

        cart.UpdateItemQuantity(
            command.CartItemId,
            command.NewQuantity,
            command.AvailableStock);

        await _cartRepository.SaveChangesAsync(ct);
    }
}

// ── Remove Cart Item ──────────────────────────────────────────────────────

public record RemoveCartItemCommand(Guid UserId, Guid CartItemId);

public class RemoveCartItemCommandHandler
{
    private readonly ICartRepository _cartRepository;

    public RemoveCartItemCommandHandler(ICartRepository cartRepository)
        => _cartRepository = cartRepository;

    public async Task Handle(RemoveCartItemCommand command, CancellationToken ct = default)
    {
        var cart = await _cartRepository.GetActiveCartByUserIdAsync(command.UserId, ct)
            ?? throw new NotFoundException("Active cart", command.UserId);

        cart.RemoveItem(command.CartItemId);
        await _cartRepository.SaveChangesAsync(ct);
    }
}
