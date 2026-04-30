using CapShop.CatalogService.Application.DTOs;
using CapShop.CatalogService.Domain.Entities;
using CapShop.CatalogService.Domain.Interfaces;
using CapShop.Shared.Exceptions;

namespace CapShop.CatalogService.Application.Commands;

public record SubmitRatingCommand(
    Guid ProductId,
    Guid UserId,
    string UserName,
    int Stars,
    string? ReviewText);

public class SubmitRatingCommandHandler
{
    private readonly IProductRepository _products;
    private readonly IProductRatingRepository _ratings;

    public SubmitRatingCommandHandler(
        IProductRepository products,
        IProductRatingRepository ratings)
    {
        _products = products;
        _ratings = ratings;
    }

    public async Task<ProductRatingDto> Handle(
        SubmitRatingCommand cmd,
        CancellationToken ct = default)
    {
        // Ensure product exists
        var product = await _products.GetByIdAsync(cmd.ProductId, ct)
            ?? throw new NotFoundException("Product", cmd.ProductId);

        // Upsert: if user already rated this product, reject with conflict
        var existing = await _ratings.GetByUserAndProductAsync(cmd.UserId, cmd.ProductId, ct);
        if (existing is not null)
            throw new ConflictException("You have already rated this product.");

        var rating = ProductRating.Create(
            cmd.ProductId, cmd.UserId, cmd.UserName, cmd.Stars, cmd.ReviewText);

        await _ratings.AddAsync(rating, ct);
        await _ratings.SaveChangesAsync(ct);

        return new ProductRatingDto
        {
            Id = rating.Id,
            ProductId = rating.ProductId,
            UserName = rating.UserName,
            Stars = rating.Stars,
            ReviewText = rating.ReviewText,
            CreatedAt = rating.CreatedAt
        };
    }
}
