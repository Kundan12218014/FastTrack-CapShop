using CapShop.OrderService.Application.Commands;
using CapShop.OrderService.Domain.Entities;
using CapShop.OrderService.Domain.Interfaces;
using CapShop.Shared.Exceptions;
using Moq;

namespace CapShop.OrderService.Tests;

[TestFixture]
public class AddToCartCommandHandlerTests
{
    private Mock<ICartRepository> _cartRepositoryMock;
    private AddToCartCommandHandler _handler;

    [SetUp]
    public void Setup()
    {
        _cartRepositoryMock = new Mock<ICartRepository>();
        _handler = new AddToCartCommandHandler(_cartRepositoryMock.Object);
    }

    [Test]
    public async Task Handle_WithNewCart_CreatesCartAndAddsItem()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var command = new AddToCartCommand(
            UserId: userId,
            ProductId: productId,
            ProductName: "Test Product",
            UnitPrice: 100m,
            Quantity: 2,
            AvailableStock: 10);

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart?)null);

        _cartRepositoryMock
            .Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart?)null);

        // Act
        var result = await _handler.Handle(command);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ProductId, Is.EqualTo(productId));
        Assert.That(result.ProductName, Is.EqualTo("Test Product"));
        Assert.That(result.Quantity, Is.EqualTo(2));
        Assert.That(result.UnitPrice, Is.EqualTo(100m));
        Assert.That(result.LineTotal, Is.EqualTo(200m));

        _cartRepositoryMock.Verify(r => r.AddAsync(It.IsAny<Cart>(), It.IsAny<CancellationToken>()), Times.Once);
        // Note: Redis-backed cart uses AddAsync (upsert) — SaveChangesAsync is not called
    }

    [Test]
    public async Task Handle_WithExistingCart_AddsItemToCart()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var existingCart = Cart.Create(userId);
        
        var command = new AddToCartCommand(
            UserId: userId,
            ProductId: productId,
            ProductName: "Test Product",
            UnitPrice: 100m,
            Quantity: 1,
            AvailableStock: 10);

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingCart);

        _cartRepositoryMock
            .Setup(r => r.GetByIdAsync(existingCart.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingCart);

        // Act
        var result = await _handler.Handle(command);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ProductId, Is.EqualTo(productId));
        Assert.That(result.Quantity, Is.EqualTo(1));
        
        _cartRepositoryMock.Verify(r => r.AddAsync(It.IsAny<Cart>(), It.IsAny<CancellationToken>()), Times.Once);
        // Note: Redis-backed cart uses AddAsync (upsert) — SaveChangesAsync is not called
    }

    [Test]
    public void Handle_WithQuantityExceedingStock_ThrowsDomainException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var command = new AddToCartCommand(
            UserId: userId,
            ProductId: Guid.NewGuid(),
            ProductName: "Test Product",
            UnitPrice: 100m,
            Quantity: 15,
            AvailableStock: 10);

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart?)null);

        // Act & Assert
        var ex = Assert.ThrowsAsync<DomainException>(async () => 
            await _handler.Handle(command));
        
        Assert.That(ex.Message, Does.Contain("stock"));
    }
}

[TestFixture]
public class UpdateCartItemCommandHandlerTests
{
    private Mock<ICartRepository> _cartRepositoryMock;
    private UpdateCartItemCommandHandler _handler;

    [SetUp]
    public void Setup()
    {
        _cartRepositoryMock = new Mock<ICartRepository>();
        _handler = new UpdateCartItemCommandHandler(_cartRepositoryMock.Object);
    }

    [Test]
    public async Task Handle_WithValidQuantity_UpdatesCartItem()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        var item = cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 1, 10);

        var command = new UpdateCartItemCommand(
            UserId: userId,
            CartItemId: item.Id,
            NewQuantity: 5,
            AvailableStock: 10);

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);

        // Act
        await _handler.Handle(command);

        // Assert
        Assert.That(cart.Items.First().Quantity, Is.EqualTo(5));
        _cartRepositoryMock.Verify(r => r.AddAsync(It.IsAny<Cart>(), It.IsAny<CancellationToken>()), Times.Once);
        // Note: Redis-backed cart uses AddAsync (upsert) — SaveChangesAsync is not called
    }

    [Test]
    public void Handle_WithNoActiveCart_ThrowsNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var command = new UpdateCartItemCommand(
            UserId: userId,
            CartItemId: Guid.NewGuid(),
            NewQuantity: 5,
            AvailableStock: 10);

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart?)null);

        // Act & Assert
        Assert.ThrowsAsync<NotFoundException>(async () => 
            await _handler.Handle(command));
    }

    [Test]
    public void Handle_WithQuantityExceedingStock_ThrowsDomainException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        var item = cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 1, 10);

        var command = new UpdateCartItemCommand(
            UserId: userId,
            CartItemId: item.Id,
            NewQuantity: 15,
            AvailableStock: 10);

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);

        // Act & Assert
        var ex = Assert.ThrowsAsync<DomainException>(async () => 
            await _handler.Handle(command));
        
        Assert.That(ex.Message, Does.Contain("stock"));
    }
}

[TestFixture]
public class RemoveCartItemCommandHandlerTests
{
    private Mock<ICartRepository> _cartRepositoryMock;
    private RemoveCartItemCommandHandler _handler;

    [SetUp]
    public void Setup()
    {
        _cartRepositoryMock = new Mock<ICartRepository>();
        _handler = new RemoveCartItemCommandHandler(_cartRepositoryMock.Object);
    }

    [Test]
    public async Task Handle_WithValidCartItem_RemovesItem()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        var item = cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);

        var command = new RemoveCartItemCommand(userId, item.Id);

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);

        // Act
        await _handler.Handle(command);

        // Assert
        Assert.That(cart.Items, Is.Empty);
        _cartRepositoryMock.Verify(r => r.AddAsync(It.IsAny<Cart>(), It.IsAny<CancellationToken>()), Times.Once);
        // Note: Redis-backed cart uses AddAsync (upsert) — SaveChangesAsync is not called
    }

    [Test]
    public void Handle_WithNoActiveCart_ThrowsNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var command = new RemoveCartItemCommand(userId, Guid.NewGuid());

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart?)null);

        // Act & Assert
        Assert.ThrowsAsync<NotFoundException>(async () => 
            await _handler.Handle(command));
    }

    [Test]
    public void Handle_WithInvalidCartItemId_ThrowsNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);

        var command = new RemoveCartItemCommand(userId, Guid.NewGuid());

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);

        // Act & Assert
        Assert.ThrowsAsync<NotFoundException>(async () => 
            await _handler.Handle(command));
    }
}
