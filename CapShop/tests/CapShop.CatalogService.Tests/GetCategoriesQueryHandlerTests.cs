using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CapShop.CatalogService.Application.Queries;
using CapShop.CatalogService.Domain.Entities;
using CapShop.CatalogService.Domain.Interfaces;
using Moq;
using NUnit.Framework;

namespace CapShop.CatalogService.Tests;

[TestFixture]
public class GetCategoriesQueryHandlerTests
{
    private Mock<ICategoryRepository> _categoryRepositoryMock;
    private GetCategoriesQueryHandler _handler;

    [SetUp]
    public void Setup()
    {
        _categoryRepositoryMock = new Mock<ICategoryRepository>();
        _handler = new GetCategoriesQueryHandler(_categoryRepositoryMock.Object);
    }

    [Test]
    public async Task Handle_ValidRequest_ReturnsMappedCategoryDtos()
    {
        // Arrange
        var query = new GetCategoriesQuery();
        var cancellationToken = new CancellationToken();

        var category1 = Category.Create("Electronics", "Devices", 1);
        typeof(Category).GetProperty("Id").SetValue(category1, 1);
        
        var category2 = Category.Create("Clothing", "Apparel", 2);
        typeof(Category).GetProperty("Id").SetValue(category2, 2);

        var categories = new List<Category> { category1, category2 };

        _categoryRepositoryMock
            .Setup(repo => repo.GetAllActiveAsync(cancellationToken))
            .ReturnsAsync(categories);

        // Act
        var result = await _handler.Handle(query, cancellationToken);

        // Assert
        Assert.That(result, Is.Not.Null);
        var categoryDtos = result.ToList();
        
        Assert.That(categoryDtos.Count, Is.EqualTo(2));
        Assert.That(categoryDtos[0].Id, Is.EqualTo(1));
        Assert.That(categoryDtos[0].Name, Is.EqualTo("Electronics"));
        Assert.That(categoryDtos[0].Description, Is.EqualTo("Devices"));
        Assert.That(categoryDtos[0].DisplayOrder, Is.EqualTo(1));

        Assert.That(categoryDtos[1].Id, Is.EqualTo(2));
        Assert.That(categoryDtos[1].Name, Is.EqualTo("Clothing"));

        _categoryRepositoryMock.Verify(repo => repo.GetAllActiveAsync(cancellationToken), Times.Once);
    }
}
