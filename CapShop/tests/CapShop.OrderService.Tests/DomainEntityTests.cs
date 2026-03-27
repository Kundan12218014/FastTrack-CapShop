using CapShop.OrderService.Domain.Entities;
using CapShop.OrderService.Domain.Enums;
using CapShop.Shared.Exceptions;

namespace CapShop.OrderService.Tests;

[TestFixture]
public class CartEntityTests
{
    [Test]
    public void Create_WithValidUserId_CreatesCart()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var cart = Cart.Create(userId);

        // Assert
        Assert.That(cart, Is.Not.Null);
        Assert.That(cart.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(cart.UserId, Is.EqualTo(userId));
        Assert.That(cart.Status, Is.EqualTo(CartStatus.Active));
        Assert.That(cart.Items, Is.Empty);
        Assert.That(cart.Total, Is.EqualTo(0));
    }

    [Test]
    public void AddItem_WithValidData_AddsItemToCart()
    {
        // Arrange
        var cart = Cart.Create(Guid.NewGuid());
        var productId = Guid.NewGuid();

        // Act
        var item = cart.AddItem(productId, "Test Product", 100m, 2, 10);

        // Assert
        Assert.That(cart.Items, Has.Count.EqualTo(1));
        Assert.That(item.ProductId, Is.EqualTo(productId));
        Assert.That(item.Quantity, Is.EqualTo(2));
        Assert.That(cart.Total, Is.EqualTo(200m));
    }

    [Test]
    public void AddItem_WithExistingProduct_UpdatesQuantity()
    {
        // Arrange
        var cart = Cart.Create(Guid.NewGuid());
        var productId = Guid.NewGuid();
        cart.AddItem(productId, "Test Product", 100m, 2, 10);

        // Act
        var item = cart.AddItem(productId, "Test Product", 100m, 3, 10);

        // Assert
        Assert.That(cart.Items, Has.Count.EqualTo(1));
        Assert.That(item.Quantity, Is.EqualTo(5)); // 2 + 3
        Assert.That(cart.Total, Is.EqualTo(500m));
    }

    [Test]
    public void AddItem_WithQuantityExceedingStock_ThrowsDomainException()
    {
        // Arrange
        var cart = Cart.Create(Guid.NewGuid());

        // Act & Assert
        var ex = Assert.Throws<DomainException>(() => 
            cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 15, 10));
        
        Assert.That(ex.Message, Does.Contain("stock"));
    }

    [Test]
    public void AddItem_WithZeroOrNegativeQuantity_ThrowsDomainException()
    {
        // Arrange
        var cart = Cart.Create(Guid.NewGuid());

        // Act & Assert
        var ex1 = Assert.Throws<DomainException>(() => 
            cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 0, 10));
        
        var ex2 = Assert.Throws<DomainException>(() => 
            cart.AddItem(Guid.NewGuid(), "Test Product", 100m, -5, 10));
        
        Assert.That(ex1.Message, Does.Contain("Quantity"));
        Assert.That(ex2.Message, Does.Contain("Quantity"));
    }

    [Test]
    public void UpdateItemQuantity_WithValidQuantity_UpdatesItem()
    {
        // Arrange
        var cart = Cart.Create(Guid.NewGuid());
        var item = cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);

        // Act
        cart.UpdateItemQuantity(item.Id, 5, 10);

        // Assert
        Assert.That(cart.Items.First().Quantity, Is.EqualTo(5));
        Assert.That(cart.Total, Is.EqualTo(500m));
    }

    [Test]
    public void UpdateItemQuantity_WithInvalidItemId_ThrowsNotFoundException()
    {
        // Arrange
        var cart = Cart.Create(Guid.NewGuid());
        cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);

        // Act & Assert
        Assert.Throws<NotFoundException>(() => 
            cart.UpdateItemQuantity(Guid.NewGuid(), 5, 10));
    }

    [Test]
    public void RemoveItem_WithValidItemId_RemovesItem()
    {
        // Arrange
        var cart = Cart.Create(Guid.NewGuid());
        var item = cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);

        // Act
        cart.RemoveItem(item.Id);

        // Assert
        Assert.That(cart.Items, Is.Empty);
        Assert.That(cart.Total, Is.EqualTo(0));
    }

    [Test]
    public void RemoveItem_WithInvalidItemId_ThrowsNotFoundException()
    {
        // Arrange
        var cart = Cart.Create(Guid.NewGuid());
        cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);

        // Act & Assert
        Assert.Throws<NotFoundException>(() => 
            cart.RemoveItem(Guid.NewGuid()));
    }

    [Test]
    public void MarkAsConverted_ChangesStatus()
    {
        // Arrange
        var cart = Cart.Create(Guid.NewGuid());
        cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);

        // Act
        cart.MarkAsConverted();

        // Assert
        Assert.That(cart.Status, Is.EqualTo(CartStatus.Converted));
    }

    [Test]
    public void AddItem_ToConvertedCart_ThrowsDomainException()
    {
        // Arrange
        var cart = Cart.Create(Guid.NewGuid());
        cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);
        cart.MarkAsConverted();

        // Act & Assert
        var ex = Assert.Throws<DomainException>(() => 
            cart.AddItem(Guid.NewGuid(), "Another Product", 50m, 1, 10));
        
        Assert.That(ex.Message, Does.Contain("no longer active"));
    }

    [Test]
    public void Total_WithMultipleItems_CalculatesCorrectly()
    {
        // Arrange
        var cart = Cart.Create(Guid.NewGuid());
        cart.AddItem(Guid.NewGuid(), "Product 1", 99.99m, 1, 10);
        cart.AddItem(Guid.NewGuid(), "Product 2", 49.50m, 2, 10);
        cart.AddItem(Guid.NewGuid(), "Product 3", 25.00m, 3, 10);

        // Act & Assert
        Assert.That(cart.Total, Is.EqualTo(273.99m)); // 99.99 + (49.50*2) + (25*3)
    }
}

[TestFixture]
public class OrderEntityTests
{
    [Test]
    public void Create_WithValidData_CreatesOrder()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        cart.AddItem(Guid.NewGuid(), "Test Product", 100m, 2, 10);

        var shippingAddress = new Domain.ValueObjects.ShippingAddress(
            "John Doe", "123 Main St", "Mumbai", "Maharashtra", "400001", "9876543210");

        // Act
        var order = Order.Create(userId, shippingAddress, PaymentMethod.COD, cart.Items.ToList());

        // Assert
        Assert.That(order, Is.Not.Null);
        Assert.That(order.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(order.OrderNumber, Is.Not.Empty);
        Assert.That(order.UserId, Is.EqualTo(userId));
        Assert.That(order.Status, Is.EqualTo(OrderStatus.Paid));
        Assert.That(order.TotalAmount, Is.EqualTo(200m));
        Assert.That(order.Items, Has.Count.EqualTo(1));
        Assert.That(order.History, Has.Count.EqualTo(1));
    }

    [Test]
    public void Create_WithEmptyCart_ThrowsDomainException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var shippingAddress = new Domain.ValueObjects.ShippingAddress(
            "John Doe", "123 Main St", "Mumbai", "Maharashtra", "400001", "9876543210");

        // Act & Assert
        var ex = Assert.Throws<DomainException>(() => 
            Order.Create(userId, shippingAddress, PaymentMethod.COD, new List<CartItem>()));
        
        Assert.That(ex.Message, Does.Contain("empty cart"));
    }

    [Test]
    public void UpdateStatus_WithValidTransition_UpdatesStatus()
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

        // Act
        order.UpdateStatus(OrderStatus.Packed, "admin", "Ready to ship");

        // Assert
        Assert.That(order.Status, Is.EqualTo(OrderStatus.Packed));
        Assert.That(order.History, Has.Count.EqualTo(2)); // Initial + Update
    }

    [Test]
    public void UpdateStatus_WithInvalidTransition_ThrowsDomainException()
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

        // Act & Assert - Try to go from Paid directly to Delivered
        var ex = Assert.Throws<DomainException>(() => 
            order.UpdateStatus(OrderStatus.Delivered, "admin", "Invalid transition"));
        
        Assert.That(ex.Message, Does.Contain("transition"));
    }

    [Test]
    public void UpdateStatus_ValidSequence_AllowsMultipleTransitions()
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

        // Act - Valid sequence: Paid → Packed → Shipped → Delivered
        order.UpdateStatus(OrderStatus.Packed, "admin", "Packed");
        order.UpdateStatus(OrderStatus.Shipped, "admin", "Shipped");
        order.UpdateStatus(OrderStatus.Delivered, "admin", "Delivered");

        // Assert
        Assert.That(order.Status, Is.EqualTo(OrderStatus.Delivered));
        Assert.That(order.History, Has.Count.EqualTo(4)); // Initial + 3 updates
    }

    [Test]
    public void Cancel_FromValidStatus_CancelsOrder()
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

        // Act
        order.UpdateStatus(OrderStatus.Cancelled, "customer", "Changed mind");

        // Assert
        Assert.That(order.Status, Is.EqualTo(OrderStatus.Cancelled));
    }

    [Test]
    public void UpdateStatus_FromDelivered_ThrowsDomainException()
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

        // Transition to Delivered
        order.UpdateStatus(OrderStatus.Packed, "admin", "Packed");
        order.UpdateStatus(OrderStatus.Shipped, "admin", "Shipped");
        order.UpdateStatus(OrderStatus.Delivered, "admin", "Delivered");

        // Act & Assert - Cannot change from Delivered
        var ex = Assert.Throws<DomainException>(() => 
            order.UpdateStatus(OrderStatus.Cancelled, "customer", "Invalid"));
        
        Assert.That(ex.Message, Does.Contain("transition"));
    }

    [Test]
    public void OrderNumber_IsUnique()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart1 = Cart.Create(userId);
        cart1.AddItem(Guid.NewGuid(), "Product 1", 100m, 1, 10);
        
        var cart2 = Cart.Create(userId);
        cart2.AddItem(Guid.NewGuid(), "Product 2", 50m, 1, 10);

        var shippingAddress = new Domain.ValueObjects.ShippingAddress(
            "John Doe", "123 Main St", "Mumbai", "Maharashtra", "400001", "9876543210");

        // Act
        var order1 = Order.Create(userId, shippingAddress, PaymentMethod.COD, cart1.Items.ToList());
        var order2 = Order.Create(userId, shippingAddress, PaymentMethod.UPI, cart2.Items.ToList());

        // Assert
        Assert.That(order1.OrderNumber, Is.Not.EqualTo(order2.OrderNumber));
    }

    [Test]
    public void TotalAmount_CalculatesCorrectly()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cart = Cart.Create(userId);
        cart.AddItem(Guid.NewGuid(), "Product 1", 99.99m, 2, 10);
        cart.AddItem(Guid.NewGuid(), "Product 2", 149.50m, 1, 10);
        cart.AddItem(Guid.NewGuid(), "Product 3", 25.00m, 3, 10);

        var shippingAddress = new Domain.ValueObjects.ShippingAddress(
            "John Doe", "123 Main St", "Mumbai", "Maharashtra", "400001", "9876543210");

        // Act
        var order = Order.Create(userId, shippingAddress, PaymentMethod.COD, cart.Items.ToList());

        // Assert
        Assert.That(order.TotalAmount, Is.EqualTo(424.48m)); // (99.99*2) + 149.50 + (25*3)
        Assert.That(order.Items, Has.Count.EqualTo(3));
    }
}

[TestFixture]
public class ShippingAddressTests
{
    [Test]
    public void Create_WithValidData_CreatesAddress()
    {
        // Act
        var address = new Domain.ValueObjects.ShippingAddress(
            "John Doe", 
            "123 Main St", 
            "Mumbai", "Maharashtra", "400001", 
            "9876543210");

        // Assert
        Assert.That(address, Is.Not.Null);
        Assert.That(address.FullName, Is.EqualTo("John Doe"));
        Assert.That(address.City, Is.EqualTo("Mumbai"));
        Assert.That(address.Pincode, Is.EqualTo("400001"));
    }

    [Test]
    public void Create_WithInvalidPincode_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => 
            new Domain.ValueObjects.ShippingAddress(
                "John Doe", "123 Main St", "Mumbai", "Maharashtra", "12345", "9876543210"));
        
        Assert.That(ex.Message, Does.Contain("Pincode"));
    }

    [Test]
    public void Create_WithEmptyFullName_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => 
            new Domain.ValueObjects.ShippingAddress(
                "", "123 Main St", "Mumbai", "Maharashtra", "400001", "9876543210"));
        
        Assert.That(ex.Message, Does.Contain("Full name"));
    }

    [Test]
    public void Create_WithEmptyAddressLine_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => 
            new Domain.ValueObjects.ShippingAddress(
                "John Doe", "", "Mumbai", "Maharashtra", "400001", "9876543210"));
        
        Assert.That(ex.Message, Does.Contain("Address"));
    }

    [Test]
    public void Create_WithEmptyPhoneNumber_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => 
            new Domain.ValueObjects.ShippingAddress(
                "John Doe", "123 Main St", "Mumbai", "Maharashtra", "400001", ""));
        
        Assert.That(ex.Message, Does.Contain("Phone"));
    }
}

[TestFixture]
public class PaymentSimulationTests
{
    [Test]
    public void Create_WithSuccessfulPayment_CreatesSimulation()
    {
        // Arrange
        var orderId = Guid.NewGuid();

        // Act
        var simulation = PaymentSimulation.Create(
            orderId, 
            PaymentMethod.UPI, 
            isSuccess: true, 
            failureReason: null);

        // Assert
        Assert.That(simulation, Is.Not.Null);
        Assert.That(simulation.OrderId, Is.EqualTo(orderId));
        Assert.That(simulation.Method, Is.EqualTo(PaymentMethod.UPI));
        Assert.That(simulation.IsSuccess, Is.True);
        Assert.That(simulation.TransactionId, Is.Not.Empty);
        Assert.That(simulation.FailureReason, Is.Null);
    }

    [Test]
    public void Create_WithFailedPayment_CreatesSimulationWithReason()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var failureReason = "Insufficient funds";

        // Act
        var simulation = PaymentSimulation.Create(
            orderId, 
            PaymentMethod.Card, 
            isSuccess: false, 
            failureReason: failureReason);

        // Assert
        Assert.That(simulation, Is.Not.Null);
        Assert.That(simulation.IsSuccess, Is.False);
        Assert.That(simulation.TransactionId, Is.Not.Empty); // Transaction ID is always generated
        Assert.That(simulation.FailureReason, Is.EqualTo(failureReason));
    }

    [Test]
    public void Create_GeneratesUniqueTransactionIds()
    {
        // Arrange
        var orderId = Guid.NewGuid();

        // Act
        var simulation1 = PaymentSimulation.Create(orderId, PaymentMethod.UPI, true, null);
        var simulation2 = PaymentSimulation.Create(orderId, PaymentMethod.UPI, true, null);

        // Assert
        Assert.That(simulation1.TransactionId, Is.Not.EqualTo(simulation2.TransactionId));
    }
}
