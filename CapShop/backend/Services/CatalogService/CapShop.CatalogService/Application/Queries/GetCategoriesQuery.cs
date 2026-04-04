using System.Text.Json;
using CapShop.CatalogService.Application.DTOs;
using CapShop.CatalogService.Domain.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace CapShop.CatalogService.Application.Queries;

public record GetCategoriesQuery;

public class GetCategoriesQueryHandler
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IDistributedCache _cache;
    private const string CategoriesCacheKey = "categories:all";

    public GetCategoriesQueryHandler(
        ICategoryRepository categoryRepository,
        IDistributedCache cache)
    {
        _categoryRepository = categoryRepository;
        _cache = cache;
    }

    public async Task<IEnumerable<CategoryDto>> Handle(
        GetCategoriesQuery query,
        CancellationToken ct = default)
    {
        var cached = await _cache.GetStringAsync(CategoriesCacheKey, ct);
        if (!string.IsNullOrEmpty(cached))
            return JsonSerializer.Deserialize<IEnumerable<CategoryDto>>(cached)!;

        var categories = await _categoryRepository.GetAllActiveAsync(ct);
        var result = categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            DisplayOrder = c.DisplayOrder
        }).ToList();

        await _cache.SetStringAsync(CategoriesCacheKey, JsonSerializer.Serialize(result),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) }, ct);

        return result;
    }
}