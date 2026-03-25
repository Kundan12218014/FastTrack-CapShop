using CapShop.CatalogService.Application.DTOs;
using CapShop.CatalogService.Domain.Entities;
using CapShop.CatalogService.Domain.Interfaces;
using CapShop.Shared.Models;

namespace CapShop.CatalogService.Application.Queries;

public record GetProductsQuery(
    string? SearchQuery,
    int? CategoryId,
    decimal? MinPrice,
    decimal? MaxPrice,
    string SortBy = "name",
    int Page = 1,
    int PageSize = 12);

public class GetProductsQueryHandler
{
    private readonly IProductRepository _productRepository;

    public GetProductsQueryHandler(IProductRepository productRepository)
        => _productRepository = productRepository;

    public async Task<PagedResult<ProductDto>> Handle(
        GetProductsQuery query,
        CancellationToken ct = default)
    {
        var filter = new ProductFilter
        {
            SearchQuery = query.SearchQuery,
            CategoryId = query.CategoryId,
            MinPrice = query.MinPrice,
            MaxPrice = query.MaxPrice,
            SortBy = query.SortBy,
            Page = query.Page,
            PageSize = Math.Clamp(query.PageSize, 1, 50), // max 50 per page
            ActiveOnly = true
        };

        var pagedProducts = await _productRepository.GetPagedAsync(filter, ct);

        // Map Product entities → ProductDtos
        var dtos = pagedProducts.Items.Select(MapToDto);

        return new PagedResult<ProductDto>(
            dtos,
            pagedProducts.TotalCount,
            pagedProducts.Page,
            pagedProducts.PageSize);
    }

    internal static ProductDto MapToDto(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Description = p.Description,
        Price = p.Price,
        StockQuantity = p.StockQuantity,
        StockStatus = p.StockStatus.ToString(),
        ImageUrl = p.ImageUrl,
        IsActive = p.IsActive,
        CreatedAt = p.CreatedAt,
        CategoryId = p.CategoryId,
        CategoryName = p.Category?.Name ?? string.Empty
    };
}