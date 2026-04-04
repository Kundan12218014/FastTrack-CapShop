using System.Text.Json;
using CapShop.CatalogService.Application.DTOs;
using CapShop.CatalogService.Domain.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace CapShop.CatalogService.Application.Queries;

public record GetFeaturedProductsQuery(int Count = 8);

public class GetFeaturedProductsQueryHandler
{
    private readonly IProductRepository _productRepository;
    private readonly IDistributedCache _cache;

    public GetFeaturedProductsQueryHandler(
        IProductRepository productRepository,
        IDistributedCache cache)
    {
        _productRepository = productRepository;
        _cache = cache;
    }

    public async Task<IEnumerable<ProductDto>> Handle(
        GetFeaturedProductsQuery query,
        CancellationToken ct = default)
    {
        var cacheKey = $"featured:{query.Count}";
        var cached = await _cache.GetStringAsync(cacheKey, ct);

        if (!string.IsNullOrEmpty(cached))
            return JsonSerializer.Deserialize<IEnumerable<ProductDto>>(cached)!;

        var products = await _productRepository.GetFeaturedAsync(query.Count, ct);
        var result = products.Select(GetProductsQueryHandler.MapToDto).ToList();

        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) }, ct);

        return result;
    }
}