namespace CapShop.OrderService.Domain.Entities;

/// <summary>
/// Records the result of a simulated payment attempt.
/// In production this would be replaced by a real payment gateway
/// integration (Razorpay, Stripe, etc.).
/// </summary>
public class PaymentSimulation
{
    public Guid Id { get; private set; }
    public Guid OrderId { get; private set; }
    public string Method { get; private set; } = string.Empty;
    public string TransactionId { get; private set; } = string.Empty;
    public bool IsSuccess { get; private set; }
    public string? FailureReason { get; private set; }
    public DateTime SimulatedAt { get; private set; }

    private PaymentSimulation() { }

    public static PaymentSimulation Create(
        Guid orderId,
        string method,
        bool isSuccess,
        string? failureReason = null) => new()
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Method = method,
            TransactionId = $"TXN-{Guid.NewGuid().ToString("N")[..10].ToUpper()}",
            IsSuccess = isSuccess,
            FailureReason = failureReason,
            SimulatedAt = DateTime.UtcNow
        };
}

public static class PaymentMethod
{
    public const string UPI = "UPI";
    public const string Card = "Card";
    public const string COD = "COD";  // Cash on delivery
}