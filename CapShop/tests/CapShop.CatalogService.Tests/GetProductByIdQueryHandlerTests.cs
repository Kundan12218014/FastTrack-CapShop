using System;
using System.Threading;
using System.Threading.Tasks;
using CapShop.CatalogService.Application.DTOs;
using CapShop.CatalogService.Application.Queries;
using CapShop.CatalogService.Domain.Entities;
using CapShop.CatalogService.Domain.Interfaces;
using CapShop.Shared.Exceptions;
using Moq;
using NUnit.Framework;

namespace CapShop.CatalogService.Tests;

[TestFixture]
public class GetProductByIdQueryHandlerTests
{
    private Mock<IProductRepository> _productRepositoryMock;
    private GetProductByIdQueryHandler _handler;

    [SetUp]
    public void Setup()
    {
        _productRepositoryMock = new Mock<IProductRepository>();
        _handler = new GetProductByIdQueryHandler(_productRepositoryMock.Object);
    }

    [Test]
    public async Task Handle_WithValidGuid_ReturnsProductDto()
    {
        // Arrange
        var product = Product.Create(
            "Test Product",
            "Test Description",
            100,
            10,
            1,
            "test.png"
        );
        var productId = product.Id;

        var query = new GetProductByIdQuery(productId);
        var cancellationToken = new CancellationToken();

        _productRepositoryMock
            .Setup(repo => repo.GetByIdAsync(productId, cancellationToken))
            .ReturnsAsync(product);

        // Act
        var result = await _handler.Handle(query, cancellationToken);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(productId));
        Assert.That(result.Name, Is.EqualTo("Test Product"));
        Assert.That(result.Price, Is.EqualTo(100));
        
        _productRepositoryMock.Verify(repo => repo.GetByIdAsync(productId, cancellationToken), Times.Once);
    }

    [Test]
    public void Handle_WithInvalidGuid_ThrowsNotFoundException()
    {
        // Arrange
        var productId = Guid.NewGuid();
        var query = new GetProductByIdQuery(productId);
        var cancellationToken = new CancellationToken();

        Product? nullProduct = null;

        _productRepositoryMock
            .Setup(repo => repo.GetByIdAsync(productId, cancellationToken))
            .ReturnsAsync(nullProduct);

        // Act & Assert
        var ex = Assert.ThrowsAsync<NotFoundException>(async () => await _handler.Handle(query, cancellationToken));
        Assert.That(ex.Message, Does.Contain("Product"));
        Assert.That(ex.Message, Does.Contain(productId.ToString()));
    }
}
