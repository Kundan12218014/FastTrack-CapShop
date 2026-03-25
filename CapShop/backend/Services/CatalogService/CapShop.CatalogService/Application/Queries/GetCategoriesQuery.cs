using CapShop.CatalogService.Application.DTOs;
using CapShop.CatalogService.Domain.Interfaces;

namespace CapShop.CatalogService.Application.Queries;

public record GetCategoriesQuery;

public class GetCategoriesQueryHandler
{
    private readonly ICategoryRepository _categoryRepository;

    public GetCategoriesQueryHandler(ICategoryRepository categoryRepository)
        => _categoryRepository = categoryRepository;

    public async Task<IEnumerable<CategoryDto>> Handle(
        GetCategoriesQuery query,
        CancellationToken ct = default)
    {
        var categories = await _categoryRepository.GetAllActiveAsync(ct);

        return categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            DisplayOrder = c.DisplayOrder
        });
    }
}