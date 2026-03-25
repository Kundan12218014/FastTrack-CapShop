using CapShop.CatalogService.Application.DTOs;
using CapShop.CatalogService.Domain.Interfaces;

namespace CapShop.CatalogService.Application.Queries;

public record GetFeaturedProductsQuery(int Count = 8);

public class GetFeaturedProductsQueryHandler
{
    private readonly IProductRepository _productRepository;

    public GetFeaturedProductsQueryHandler(IProductRepository productRepository)
        => _productRepository = productRepository;

    public async Task<IEnumerable<ProductDto>> Handle(
        GetFeaturedProductsQuery query,
        CancellationToken ct = default)
    {
        var products = await _productRepository.GetFeaturedAsync(query.Count, ct);
        return products.Select(GetProductsQueryHandler.MapToDto);
    }
}