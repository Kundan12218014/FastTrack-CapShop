using CapShop.AuthService.Domain.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using CapShop.AuthService.Domain.Entities;
using System.Text;


namespace CapShop.AuthService.Infrastructure.Security
{
    public class JwtTokenGenerator : IJwtTokenGenerator
    {
        private readonly IConfiguration _configruation;
        public JwtTokenGenerator(IConfiguration configuration)
        {
            _configruation = configuration;
        }
        public string GenerateToken(User user)
        {
            var jwt = _configruation.GetSection("JwtSettings");
            var secretKey = jwt["SecretKey"]?.Trim();
            var issuer = jwt["Issuer"]?.Trim();
            var audience = jwt["Audience"]?.Trim();

            if (string.IsNullOrWhiteSpace(secretKey))
                throw new InvalidOperationException("JwtSettings:SecretKey is not configured.");

            if (string.IsNullOrWhiteSpace(issuer))
                throw new InvalidOperationException("JwtSettings:Issuer is not configured.");

            if (string.IsNullOrWhiteSpace(audience))
                throw new InvalidOperationException("JwtSettings:Audience is not configured.");

            var expiryMinutes = int.Parse(jwt["ExpiryMinutes"] ?? "60");
            //signinig credientials
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new List<Claim>
            {
            new(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat,
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64),
            new(ClaimTypes.Role,               user.Role),
            new(ClaimTypes.NameIdentifier,     user.Id.ToString()),
            new(ClaimTypes.Name,               user.FullName),
            new("userId",                      user.Id.ToString()),
            new("role",                        user.Role),
            new("fullName",                    user.FullName),
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials
                );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
