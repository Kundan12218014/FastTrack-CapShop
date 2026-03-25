using CapShop.CatalogService.Application.DTOs;
using CapShop.CatalogService.Application.Queries;
using CapShop.CatalogService.Domain.Entities;
using CapShop.CatalogService.Domain.Interfaces;
using CapShop.Shared.Models;
using Moq;
using NUnit.Framework;

namespace CapShop.CatalogService.Tests;

[TestFixture]
public class GetProductsQueryHandlerTests
{
    private Mock<IProductRepository> _productRepositoryMock;
    private GetProductsQueryHandler _handler;

    [SetUp]
    public void Setup()
    {
        _productRepositoryMock = new Mock<IProductRepository>();
        _handler = new GetProductsQueryHandler(_productRepositoryMock.Object);
    }

    [Test]
    public async Task Handle_WithValidQuery_ReturnsPagedResultOfProductDto()
    {
        // Arrange
        var query = new GetProductsQuery(
            SearchQuery: "Test",
            CategoryId: 1,
            MinPrice: 10m,
            MaxPrice: 100m,
            SortBy: "name",
            Page: 2,
            PageSize: 10);

        var cancellationToken = new CancellationToken();

        var products = new List<Product>
        {
            Product.Create("Product 1", "Test Description", 50, 10, 1),
            Product.Create("Product 2", "Test Description", 75, 5, 1)
        };

        var pagedProducts = new PagedResult<Product>(products, 50, 2, 10);

        _productRepositoryMock
            .Setup(repo => repo.GetPagedAsync(It.IsAny<ProductFilter>(), cancellationToken))
            .ReturnsAsync(pagedProducts);

        // Act
        var result = await _handler.Handle(query, cancellationToken);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TotalCount, Is.EqualTo(50));
        Assert.That(result.Page, Is.EqualTo(2));
        Assert.That(result.PageSize, Is.EqualTo(10));
        Assert.That(result.Items.Count(), Is.EqualTo(2));
        Assert.That(result.Items.First().Name, Is.EqualTo("Product 1"));
        Assert.That(result.Items.First().Price, Is.EqualTo(50));

        // Verify the created filter has correctly mapped values
        _productRepositoryMock.Verify(repo => repo.GetPagedAsync(It.Is<ProductFilter>(f => 
            f.SearchQuery == "Test" &&
            f.CategoryId == 1 &&
            f.MinPrice == 10m &&
            f.MaxPrice == 100m &&
            f.SortBy == "name" &&
            f.Page == 2 &&
            f.PageSize == 10 &&
            f.ActiveOnly == true), cancellationToken), Times.Once);
    }

    [Test]
    public async Task Handle_WithPageSizeGreaterThanMax_ClampsPageSizeToMax()
    {
        // Arrange
        var query = new GetProductsQuery(
            SearchQuery: null,
            CategoryId: null,
            MinPrice: null,
            MaxPrice: null,
            PageSize: 100); // More than max 50

        var cancellationToken = new CancellationToken();
        var pagedProducts = new PagedResult<Product>(new List<Product>(), 0, 1, 50);

        _productRepositoryMock
            .Setup(repo => repo.GetPagedAsync(It.IsAny<ProductFilter>(), cancellationToken))
            .ReturnsAsync(pagedProducts);

        // Act
        await _handler.Handle(query, cancellationToken);

        // Assert
        _productRepositoryMock.Verify(repo => repo.GetPagedAsync(It.Is<ProductFilter>(f => 
            f.PageSize == 50), cancellationToken), Times.Once);
    }

    [Test]
    public async Task Handle_WithPageSizeLessThanMin_ClampsPageSizeToMin()
    {
        // Arrange
        var query = new GetProductsQuery(
            SearchQuery: null,
            CategoryId: null,
            MinPrice: null,
            MaxPrice: null,
            PageSize: -5); // Less than min 1

        var cancellationToken = new CancellationToken();
        var pagedProducts = new PagedResult<Product>(new List<Product>(), 0, 1, 1);

        _productRepositoryMock
            .Setup(repo => repo.GetPagedAsync(It.IsAny<ProductFilter>(), cancellationToken))
            .ReturnsAsync(pagedProducts);

        // Act
        await _handler.Handle(query, cancellationToken);

        // Assert
        _productRepositoryMock.Verify(repo => repo.GetPagedAsync(It.Is<ProductFilter>(f => 
            f.PageSize == 1), cancellationToken), Times.Once);
    }
}
