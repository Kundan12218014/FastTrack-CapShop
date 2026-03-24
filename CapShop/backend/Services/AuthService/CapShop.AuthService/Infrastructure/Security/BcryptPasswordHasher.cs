using BCrypt.Net;
using CapShop.AuthService.Domain.Interfaces;

namespace CapShop.AuthService.Infrastructure.Security
{
    public class BcryptPasswordHasher:IPasswordHasher
    {
        private const int WorkFactor = 12;
        public string Hash(string plainTextPassword)
        {
            if (string.IsNullOrWhiteSpace(plainTextPassword))
            {
                throw new ArgumentException("Password cannot be empty", nameof(plainTextPassword));
            }
            return BCrypt.Net.BCrypt.HashPassword(plainTextPassword, WorkFactor);

        }
        public bool Verify(string plainTextPassword, string hash)
        {
            if (string.IsNullOrWhiteSpace(plainTextPassword)||string.IsNullOrWhiteSpace(hash)){
                return false;
            }
            return BCrypt.Net.BCrypt.Verify(plainTextPassword,hash);
        }
    }
}
