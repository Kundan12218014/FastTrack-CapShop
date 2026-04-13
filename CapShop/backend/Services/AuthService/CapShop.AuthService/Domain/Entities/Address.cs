namespace CapShop.AuthService.Domain.Entities
{
    public class Address
    {
        public Guid Id { get; private set; }
        public Guid UserId { get; private set; }
        public string Title { get; private set; } = string.Empty;
        public string Detail { get; private set; } = string.Empty;
        public DateTime CreatedAt { get; private set; }
        public DateTime UpdatedAt { get; private set; }

        public User User { get; private set; } = null!;

        private Address() { }

        public static Address Create(Guid userId, string title, string detail)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new ArgumentException("Title is required", nameof(title));
            if (string.IsNullOrWhiteSpace(detail))
                throw new ArgumentException("Detail is required", nameof(detail));

            return new Address
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title.Trim(),
                Detail = detail.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        public void Update(string title, string detail)
        {
            if (!string.IsNullOrWhiteSpace(title)) Title = title.Trim();
            if (!string.IsNullOrWhiteSpace(detail)) Detail = detail.Trim();
            UpdatedAt = DateTime.UtcNow;
        }
    }
}