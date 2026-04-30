namespace CapShop.CatalogService.Domain.Entities;

/// <summary>
/// A customer rating (1–5 stars) with an optional text review for a product.
/// One user can rate a product only once — enforced by a unique index in the DB.
/// </summary>
public class ProductRating
{
    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public Guid UserId { get; private set; }
    public string UserName { get; private set; } = string.Empty;
    public int Stars { get; private set; }          // 1–5
    public string? ReviewText { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public Product Product { get; private set; } = null!;

    private ProductRating() { }

    public static ProductRating Create(
        Guid productId,
        Guid userId,
        string userName,
        int stars,
        string? reviewText = null)
    {
        if (stars < 1 || stars > 5)
            throw new ArgumentOutOfRangeException(nameof(stars), "Stars must be between 1 and 5.");
        if (string.IsNullOrWhiteSpace(userName))
            throw new ArgumentException("User name is required.", nameof(userName));

        return new ProductRating
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            UserId = userId,
            UserName = userName.Trim(),
            Stars = stars,
            ReviewText = reviewText?.Trim(),
            CreatedAt = DateTime.UtcNow
        };
    }
}
