using CapShop.OrderService.Application.DTOs;
using CapShop.OrderService.Application.Queries;
using CapShop.OrderService.Domain.Entities;
using CapShop.OrderService.Domain.Enums;
using CapShop.OrderService.Domain.Interfaces;
using CapShop.Shared.Exceptions;
using CapShop.Shared.Models;
using Moq;

namespace CapShop.OrderService.Tests;

[TestFixture]
public class GetCartQueryHandlerTests
{
    private Mock<ICartRepository> _cartRepositoryMock;
    private GetCartQueryHandler _handler;

    [SetUp]
    public void Setup()
    {
        _cartRepositoryMock = new Mock<ICartRepository>();
        _handler = new GetCartQueryHandler(_cartRepositoryMock.Object);
    }

    [Test]
    public async Task Handle_WithExistingCart_ReturnsCartDto()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        cart.AddItem(Guid.NewGuid(), "Product 1", 100m, 2, 10);
        cart.AddItem(Guid.NewGuid(), "Product 2", 50m, 3, 10);

        var query = new GetCartQuery(userId);

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);

        // Act
        var result = await _handler.Handle(query);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(cart.Id));
        Assert.That(result.Status, Is.EqualTo(CartStatus.Active));
        Assert.That(result.Items, Has.Count.EqualTo(2));
        Assert.That(result.Total, Is.EqualTo(350m)); // (100*2) + (50*3)
        Assert.That(result.ItemCount, Is.EqualTo(5)); // 2 + 3
    }

    [Test]
    public async Task Handle_WithNoCart_ReturnsEmptyCartDto()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var query = new GetCartQuery(userId);

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart?)null);

        // Act
        var result = await _handler.Handle(query);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(Guid.Empty));
        Assert.That(result.Status, Is.EqualTo(CartStatus.Active));
        Assert.That(result.Items, Is.Empty);
        Assert.That(result.Total, Is.EqualTo(0));
        Assert.That(result.ItemCount, Is.EqualTo(0));
    }

    [Test]
    public async Task Handle_WithCartWithMultipleItems_CalculatesTotalCorrectly()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        cart.AddItem(Guid.NewGuid(), "Product 1", 99.99m, 1, 10);
        cart.AddItem(Guid.NewGuid(), "Product 2", 149.50m, 2, 10);
        cart.AddItem(Guid.NewGuid(), "Product 3", 25.00m, 4, 10);

        var query = new GetCartQuery(userId);

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);

        // Act
        var result = await _handler.Handle(query);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Total, Is.EqualTo(498.99m)); // 99.99 + (149.50*2) + (25*4)
        Assert.That(result.ItemCount, Is.EqualTo(7)); // 1 + 2 + 4
        Assert.That(result.Items, Has.Count.EqualTo(3));
    }
}

[TestFixture]
public class GetMyOrdersQueryHandlerTests
{
    private Mock<IOrderRepository> _orderRepositoryMock;
    private GetMyOrdersQueryHandler _handler;

    [SetUp]
    public void Setup()
    {
        _orderRepositoryMock = new Mock<IOrderRepository>();
        _handler = new GetMyOrdersQueryHandler(_orderRepositoryMock.Object);
    }

    [Test]
    public async Task Handle_WithValidUserId_ReturnsPagedOrders()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart1 = Cart.Create(userId);
        cart1.AddItem(Guid.NewGuid(), "Product 1", 100m, 2, 10);
        
        var cart2 = Cart.Create(userId);
        cart2.AddItem(Guid.NewGuid(), "Product 2", 50m, 3, 10);

        var order1 = Order.Create(
            userId,
            new Domain.ValueObjects.ShippingAddress("John Doe", "123 Main St", "Mumbai", "Maharashtra", "400001", "9876543210"),
            PaymentMethod.COD,
            cart1.Items.ToList());

        var order2 = Order.Create(
            userId,
            new Domain.ValueObjects.ShippingAddress("John Doe", "123 Main St", "Mumbai", "Maharashtra", "400001", "9876543210"),
            PaymentMethod.UPI,
            cart2.Items.ToList());

        var orders = new List<Order> { order1, order2 };
        var pagedResult = new PagedResult<Order>(orders, 2, 1, 10);

        var query = new GetMyOrdersQuery(userId, Page: 1, PageSize: 10);

        _orderRepositoryMock
            .Setup(r => r.GetByUserIdAsync(userId, 1, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _handler.Handle(query);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TotalCount, Is.EqualTo(2));
        Assert.That(result.Items.Count(), Is.EqualTo(2));
        Assert.That(result.Page, Is.EqualTo(1));
        Assert.That(result.PageSize, Is.EqualTo(10));
        
        var firstOrder = result.Items.First();
        Assert.That(firstOrder.OrderNumber, Is.Not.Empty);
        Assert.That(firstOrder.TotalAmount, Is.GreaterThan(0));
        Assert.That(firstOrder.Status, Is.Not.Empty);
    }

    [Test]
    public async Task Handle_WithNoOrders_ReturnsEmptyPagedResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var emptyResult = new PagedResult<Order>(new List<Order>(), 0, 1, 10);

        var query = new GetMyOrdersQuery(userId, Page: 1, PageSize: 10);

        _orderRepositoryMock
            .Setup(r => r.GetByUserIdAsync(userId, 1, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyResult);

        // Act
        var result = await _handler.Handle(query);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TotalCount, Is.EqualTo(0));
        Assert.That(result.Items, Is.Empty);
    }

    [Test]
    public async Task Handle_WithPagination_ReturnsCorrectPage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        cart.AddItem(Guid.NewGuid(), "Product 1", 100m, 2, 10);

        var order = Order.Create(
            userId,
            new Domain.ValueObjects.ShippingAddress("John Doe", "123 Main St", "Mumbai", "Maharashtra", "400001", "9876543210"),
            PaymentMethod.COD,
            cart.Items.ToList());

        var orders = new List<Order> { order };
        var pagedResult = new PagedResult<Order>(orders, 25, 3, 10); // Page 3 of 25 total items

        var query = new GetMyOrdersQuery(userId, Page: 3, PageSize: 10);

        _orderRepositoryMock
            .Setup(r => r.GetByUserIdAsync(userId, 3, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Act
        var result = await _handler.Handle(query);

        // Assert
        Assert.That(result.Page, Is.EqualTo(3));
        Assert.That(result.PageSize, Is.EqualTo(10));
        Assert.That(result.TotalCount, Is.EqualTo(25));
        
        _orderRepositoryMock.Verify(r => r.GetByUserIdAsync(userId, 3, 10, It.IsAny<CancellationToken>()), Times.Once);
    }
}

[TestFixture]
public class GetOrderByIdQueryHandlerTests
{
    private Mock<IOrderRepository> _orderRepositoryMock;
    private GetOrderByIdQueryHandler _handler;

    [SetUp]
    public void Setup()
    {
        _orderRepositoryMock = new Mock<IOrderRepository>();
        _handler = new GetOrderByIdQueryHandler(_orderRepositoryMock.Object);
    }

    [Test]
    public async Task Handle_WithValidOrderId_ReturnsOrderDto()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        var productId = Guid.NewGuid();
        cart.AddItem(productId, "Test Product", 100m, 2, 10);

        var order = Order.Create(
            userId,
            new Domain.ValueObjects.ShippingAddress("John Doe", "123 Main St", "Mumbai", "Maharashtra", "400001", "9876543210"),
            PaymentMethod.COD,
            cart.Items.ToList());

        var query = new GetOrderByIdQuery(order.Id, userId);

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        // Act
        var result = await _handler.Handle(query);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(order.Id));
        Assert.That(result.OrderNumber, Is.Not.Empty);
        Assert.That(result.TotalAmount, Is.EqualTo(200m));
        Assert.That(result.Status, Is.EqualTo(OrderStatus.Paid.ToString()));
        Assert.That(result.PaymentMethod, Is.EqualTo(PaymentMethod.COD));
        Assert.That(result.Items, Has.Count.EqualTo(1));
        Assert.That(result.Items.First().ProductId, Is.EqualTo(productId));
        Assert.That(result.Items.First().Quantity, Is.EqualTo(2));
        Assert.That(result.ShippingAddress, Is.Not.Null);
        Assert.That(result.ShippingAddress.FullName, Is.EqualTo("John Doe"));
    }

    [Test]
    public void Handle_WithInvalidOrderId_ThrowsNotFoundException()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var query = new GetOrderByIdQuery(orderId, userId);

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(orderId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order?)null);

        // Act & Assert
        Assert.ThrowsAsync<NotFoundException>(async () => 
            await _handler.Handle(query));
    }

    [Test]
    public void Handle_WithUnauthorizedUser_ThrowsForbiddenException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);

        var order = Order.Create(
            userId,
            new Domain.ValueObjects.ShippingAddress("John Doe", "123 Main St", "Mumbai", "Maharashtra", "400001", "9876543210"),
            PaymentMethod.COD,
            cart.Items.ToList());

        var query = new GetOrderByIdQuery(order.Id, differentUserId);

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenException>(async () => 
            await _handler.Handle(query));
    }

    [Test]
    public async Task Handle_WithMultipleItems_ReturnsAllItems()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        cart.AddItem(Guid.NewGuid(), "Product 1", 100m, 2, 10);
        cart.AddItem(Guid.NewGuid(), "Product 2", 50m, 3, 10);
        cart.AddItem(Guid.NewGuid(), "Product 3", 25m, 1, 10);

        var order = Order.Create(
            userId,
            new Domain.ValueObjects.ShippingAddress("John Doe", "123 Main St", "Mumbai", "Maharashtra", "400001", "9876543210"),
            PaymentMethod.UPI,
            cart.Items.ToList());

        var query = new GetOrderByIdQuery(order.Id, userId);

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        // Act
        var result = await _handler.Handle(query);

        // Assert
        Assert.That(result.Items, Has.Count.EqualTo(3));
        Assert.That(result.TotalAmount, Is.EqualTo(375m)); // (100*2) + (50*3) + (25*1)
        Assert.That(result.Items.Sum(i => i.Quantity), Is.EqualTo(6));
    }
}
