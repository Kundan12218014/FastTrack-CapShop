using System;
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
public class GetFeaturedProductsQueryHandlerTests
{
    private Mock<IProductRepository> _productRepositoryMock;
    private GetFeaturedProductsQueryHandler _handler;

    [SetUp]
    public void Setup()
    {
        _productRepositoryMock = new Mock<IProductRepository>();
        _handler = new GetFeaturedProductsQueryHandler(_productRepositoryMock.Object);
    }

    [Test]
    public async Task Handle_WithValidCount_ReturnsMappedProductDtos()
    {
        // Arrange
        var query = new GetFeaturedProductsQuery(Count: 5);
        var cancellationToken = new CancellationToken();

        var products = new List<Product>
        {
            Product.Create("Featured 1", "Description 1", 10, 100, 1),
            Product.Create("Featured 2", "Description 2", 20, 0, 1)
        };

        _productRepositoryMock
            .Setup(repo => repo.GetFeaturedAsync(5, cancellationToken))
            .ReturnsAsync(products);

        // Act
        var result = await _handler.Handle(query, cancellationToken);

        // Assert
        Assert.That(result, Is.Not.Null);
        var productDtos = result.ToList();
        Assert.That(productDtos.Count, Is.EqualTo(2));
        Assert.That(productDtos[0].Name, Is.EqualTo("Featured 1"));
        Assert.That(productDtos[1].Name, Is.EqualTo("Featured 2"));

        _productRepositoryMock.Verify(repo => repo.GetFeaturedAsync(5, cancellationToken), Times.Once);
    }
}
