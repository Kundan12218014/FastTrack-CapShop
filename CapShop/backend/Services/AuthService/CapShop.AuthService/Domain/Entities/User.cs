namespace CapShop.AuthService.Domain.Entities
{
    public class User
    {
        public Guid Id { get; private set; }
        public string FullName { get; private set; } = string.Empty;
        public string Email { get; private set; } = string.Empty;
        public string PhoneNumber { get; private set; } = string.Empty;

        public string PasswordHash { get; private set; } = string.Empty;
        public string Role { get; private set; } = UserRoles.Customer;
        public bool IsActive { get; private set; } = true;
        public DateTime CreatedAt { get; private set; }
        public DateTime UpdatedAt { get; private set; }


        private User() { }
        public static User Create(string fullName,string email,string phoneNumber,string passwordHash,string role = UserRoles.Customer)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                throw new ArgumentException("Full name is required", nameof(fullName));
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email is required.", nameof(email));
            if (string.IsNullOrWhiteSpace(passwordHash))
                throw new ArgumentException("Password hash is required.", nameof(passwordHash);
            return new User
            {
                Id = Guid.NewGuid(),
                FullName = fullName.Trim(),
                Email = email.Trim().ToLowerInvariant(),
                PhoneNumber = phoneNumber.Trim(),
                PasswordHash = passwordHash,
                Role = role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }
        public void Activate()
        {
            IsActive = true;
            UpdatedAt = DateTime.UtcNow;
        }
        public void Deactivate()
        {
            IsActive = false;
            UpdatedAt = DateTime.UtcNow;
        }
        public void UpdateProfile(string fullName,string phoneNumber)
        {
            if (!string.IsNullOrWhiteSpace(fullName)){
                FullName = FullName.Trim();
            }
            if (!string.IsNullOrWhiteSpace(phoneNumber)){
                PhoneNumber = phoneNumber.Trim();
            }
            UpdatedAt = DateTime.UtcNow;

        }
    }

    internal class UserRoles
    {
        public const string Customer = "Customer";
        public const string Admin = "Admin";
    }
}
