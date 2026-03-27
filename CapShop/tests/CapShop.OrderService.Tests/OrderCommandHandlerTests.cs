using CapShop.OrderService.Application.Commands;
using CapShop.OrderService.Application.DTOs;
using CapShop.OrderService.Domain.Entities;
using CapShop.OrderService.Domain.Enums;
using CapShop.OrderService.Domain.Interfaces;
using CapShop.Shared.Exceptions;
using Moq;

namespace CapShop.OrderService.Tests;

[TestFixture]
public class SimulatePaymentCommandHandlerTests
{
    private Mock<IPaymentSimulationRepository> _paymentRepositoryMock;
    private Mock<ICartRepository> _cartRepositoryMock;
    private SimulatePaymentCommandHandler _handler;

    [SetUp]
    public void Setup()
    {
        _paymentRepositoryMock = new Mock<IPaymentSimulationRepository>();
        _cartRepositoryMock = new Mock<ICartRepository>();
        _handler = new SimulatePaymentCommandHandler(
            _paymentRepositoryMock.Object, 
            _cartRepositoryMock.Object);
    }

    [Test]
    public async Task Handle_WithCODPayment_AlwaysSucceeds()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);

        var command = new SimulatePaymentCommand(userId, PaymentMethod.COD);

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);

        // Act
        var result = await _handler.Handle(command);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.TransactionId, Is.Not.Empty);
        Assert.That(result.Message, Does.Contain("successful"));
        
        _paymentRepositoryMock.Verify(r => r.AddAsync(It.IsAny<PaymentSimulation>(), It.IsAny<CancellationToken>()), Times.Once);
        _paymentRepositoryMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task Handle_WithUPIPayment_MaySucceedOrFail()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);

        var command = new SimulatePaymentCommand(userId, PaymentMethod.UPI);

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);

        // Act
        var result = await _handler.Handle(command);

        // Assert
        Assert.That(result, Is.Not.Null);
        // Result can be success or failure, just verify it has proper structure
        if (result.IsSuccess)
        {
            Assert.That(result.TransactionId, Is.Not.Empty);
            Assert.That(result.Message, Does.Contain("successful"));
        }
        else
        {
            Assert.That(result.FailureReason, Is.Not.Null);
            Assert.That(result.Message, Does.Contain("failed"));
        }
        
        _paymentRepositoryMock.Verify(r => r.AddAsync(It.IsAny<PaymentSimulation>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public void Handle_WithEmptyCart_ThrowsDomainException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var emptyCart = Cart.Create(userId);

        var command = new SimulatePaymentCommand(userId, PaymentMethod.COD);

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyCart);

        // Act & Assert
        var ex = Assert.ThrowsAsync<DomainException>(async () => 
            await _handler.Handle(command));
        
        Assert.That(ex.Message, Does.Contain("Cart is empty"));
    }

    [Test]
    public void Handle_WithNoCart_ThrowsDomainException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var command = new SimulatePaymentCommand(userId, PaymentMethod.COD);

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart?)null);

        // Act & Assert
        var ex = Assert.ThrowsAsync<DomainException>(async () => 
            await _handler.Handle(command));
        
        Assert.That(ex.Message, Does.Contain("No active cart found"));
    }
}

[TestFixture]
public class PlaceOrderCommandHandlerTests
{
    private Mock<ICartRepository> _cartRepositoryMock;
    private Mock<IOrderRepository> _orderRepositoryMock;
    private PlaceOrderCommandHandler _handler;

    [SetUp]
    public void Setup()
    {
        _cartRepositoryMock = new Mock<ICartRepository>();
        _orderRepositoryMock = new Mock<IOrderRepository>();
        _handler = new PlaceOrderCommandHandler(
            _cartRepositoryMock.Object, 
            _orderRepositoryMock.Object);
    }

    [Test]
    public async Task Handle_WithValidCart_CreatesOrder()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);

        var shippingAddress = new ShippingAddressDto
        {
            FullName = "John Doe",
            AddressLine = "123 Main St",
            City = "Mumbai",
            State = "Maharashtra",
            Pincode = "400001",
            PhoneNumber = "9876543210"
        };

        var command = new PlaceOrderCommand(
            UserId: userId,
            ShippingAddress: shippingAddress,
            PaymentMethod: PaymentMethod.COD,
            TransactionId: "TXN123");

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);

        // Act
        var result = await _handler.Handle(command);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.OrderNumber, Is.Not.Empty);
        Assert.That(result.TotalAmount, Is.EqualTo(200m));
        Assert.That(result.Status, Is.EqualTo(OrderStatus.Paid.ToString()));
        Assert.That(result.PaymentMethod, Is.EqualTo(PaymentMethod.COD));
        Assert.That(result.Items, Has.Count.EqualTo(1));
        Assert.That(result.ShippingAddress, Is.Not.Null);
        
        _orderRepositoryMock.Verify(r => r.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()), Times.Once);
        _orderRepositoryMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _cartRepositoryMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public void Handle_WithEmptyCart_ThrowsDomainException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var emptyCart = Cart.Create(userId);

        var shippingAddress = new ShippingAddressDto
        {
            FullName = "John Doe",
            AddressLine = "123 Main St",
            City = "Mumbai",
            State = "Maharashtra",
            Pincode = "400001",
            PhoneNumber = "9876543210"
        };

        var command = new PlaceOrderCommand(
            UserId: userId,
            ShippingAddress: shippingAddress,
            PaymentMethod: PaymentMethod.COD,
            TransactionId: "TXN123");

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyCart);

        // Act & Assert
        var ex = Assert.ThrowsAsync<DomainException>(async () => 
            await _handler.Handle(command));
        
        Assert.That(ex.Message, Does.Contain("empty cart"));
    }

    [Test]
    public void Handle_WithNoCart_ThrowsDomainException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var shippingAddress = new ShippingAddressDto
        {
            FullName = "John Doe",
            AddressLine = "123 Main St",
            City = "Mumbai",
            State = "Maharashtra",
            Pincode = "400001",
            PhoneNumber = "9876543210"
        };

        var command = new PlaceOrderCommand(
            UserId: userId,
            ShippingAddress: shippingAddress,
            PaymentMethod: PaymentMethod.COD,
            TransactionId: "TXN123");

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart?)null);

        // Act & Assert
        var ex = Assert.ThrowsAsync<DomainException>(async () => 
            await _handler.Handle(command));
        
        Assert.That(ex.Message, Does.Contain("No active cart found"));
    }

    [Test]
    public void Handle_WithInvalidPincode_ThrowsArgumentException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);

        var shippingAddress = new ShippingAddressDto
        {
            FullName = "John Doe",
            AddressLine = "123 Main St",
            City = "Mumbai",
            State = "Maharashtra",
            Pincode = "12345", // Invalid pincode (not 6 digits)
            PhoneNumber = "9876543210"
        };

        var command = new PlaceOrderCommand(
            UserId: userId,
            ShippingAddress: shippingAddress,
            PaymentMethod: PaymentMethod.COD,
            TransactionId: "TXN123");

        _cartRepositoryMock
            .Setup(r => r.GetActiveCartByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);

        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(async () => 
            await _handler.Handle(command));
    }
}

[TestFixture]
public class CancelOrderCommandHandlerTests
{
    private Mock<IOrderRepository> _orderRepositoryMock;
    private CancelOrderCommandHandler _handler;

    [SetUp]
    public void Setup()
    {
        _orderRepositoryMock = new Mock<IOrderRepository>();
        _handler = new CancelOrderCommandHandler(_orderRepositoryMock.Object);
    }

    [Test]
    public async Task Handle_WithValidOrder_CancelsOrder()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);
        
        var order = Order.Create(
            userId,
            new Domain.ValueObjects.ShippingAddress("John Doe", "123 Main St", "Mumbai", "Maharashtra", "400001", "9876543210"),
            PaymentMethod.COD,
            cart.Items.ToList());

        var command = new CancelOrderCommand(
            OrderId: order.Id,
            UserId: userId,
            Reason: "Changed mind");

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        // Act
        await _handler.Handle(command);

        // Assert
        Assert.That(order.Status, Is.EqualTo(OrderStatus.Cancelled));
        _orderRepositoryMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public void Handle_WithInvalidOrderId_ThrowsNotFoundException()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var command = new CancelOrderCommand(
            OrderId: orderId,
            UserId: userId,
            Reason: "Changed mind");

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(orderId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order?)null);

        // Act & Assert
        Assert.ThrowsAsync<NotFoundException>(async () => 
            await _handler.Handle(command));
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

        var command = new CancelOrderCommand(
            OrderId: order.Id,
            UserId: differentUserId, // Different user trying to cancel
            Reason: "Changed mind");

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        // Act & Assert
        var ex = Assert.ThrowsAsync<ForbiddenException>(async () => 
            await _handler.Handle(command));
        
        Assert.That(ex.Message, Does.Contain("cancel"));
    }
}
