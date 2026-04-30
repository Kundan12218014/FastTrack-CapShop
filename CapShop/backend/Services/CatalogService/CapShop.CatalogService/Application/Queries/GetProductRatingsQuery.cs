using CapShop.CatalogService.Application.DTOs;
using CapShop.CatalogService.Domain.Interfaces;

namespace CapShop.CatalogService.Application.Queries;

public record GetProductRatingsQuery(Guid ProductId, int Limit = 20);

public class GetProductRatingsQueryHandler
{
    private readonly IProductRatingRepository _ratings;

    public GetProductRatingsQueryHandler(IProductRatingRepository ratings)
        => _ratings = ratings;

    public async Task<IEnumerable<ProductRatingDto>> Handle(
        GetProductRatingsQuery query,
        CancellationToken ct = default)
    {
        var ratings = await _ratings.GetByProductIdAsync(query.ProductId, query.Limit, ct);
        return ratings.Select(r => new ProductRatingDto
        {
            Id = r.Id,
            ProductId = r.ProductId,
            UserName = r.UserName,
            Stars = r.Stars,
            ReviewText = r.ReviewText,
            CreatedAt = r.CreatedAt
        });
    }
}

public record GetRatingAggregateQuery(Guid ProductId);

public class GetRatingAggregateQueryHandler
{
    private readonly IProductRatingRepository _ratings;

    public GetRatingAggregateQueryHandler(IProductRatingRepository ratings)
        => _ratings = ratings;

    public async Task<RatingAggregateDto> Handle(
        GetRatingAggregateQuery query,
        CancellationToken ct = default)
    {
        var (average, count) = await _ratings.GetAggregateAsync(query.ProductId, ct);

        // Build star distribution (1–5)
        var allRatings = await _ratings.GetByProductIdAsync(query.ProductId, int.MaxValue, ct);
        var distribution = Enumerable.Range(1, 5)
            .ToDictionary(s => s, s => allRatings.Count(r => r.Stars == s));

        return new RatingAggregateDto
        {
            Average = average,
            Count = count,
            Distribution = distribution
        };
    }
}
