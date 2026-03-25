using CapShop.CatalogService.Application.DTOs;
using CapShop.CatalogService.Domain.Interfaces;
using CapShop.Shared.Exceptions;

namespace CapShop.CatalogService.Application.Queries;

public record GetProductByIdQuery(Guid ProductId);

public class GetProductByIdQueryHandler
{
    private readonly IProductRepository _productRepository;

    public GetProductByIdQueryHandler(IProductRepository productRepository)
        => _productRepository = productRepository;

    public async Task<ProductDto> Handle(
        GetProductByIdQuery query,
        CancellationToken ct = default)
    {
        var product = await _productRepository.GetByIdAsync(query.ProductId, ct)
            ?? throw new NotFoundException("Product", query.ProductId);

        return GetProductsQueryHandler.MapToDto(product);
    }
}