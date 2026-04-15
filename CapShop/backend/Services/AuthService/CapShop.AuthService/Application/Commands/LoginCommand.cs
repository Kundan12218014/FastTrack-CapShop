using CapShop.AuthService.Application.DTOs;
using CapShop.AuthService.Domain.Interfaces;
using CapShop.Shared.Exceptions;
using Microsoft.Extensions.Caching.Distributed;

namespace CapShop.AuthService.Application.Commands;
public record LoginCommand(string Email, string Password);
public class LoginCommandHandler
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IEmailService _emailService;
    private readonly IDistributedCache _cache;

    public LoginCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        IEmailService emailService,
        IDistributedCache cache
        )
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _emailService = emailService;
        _cache = cache;
    }
    public async Task<LoginResponseDto> Handle(
        LoginCommand command,
        CancellationToken ct = default)
    {
        //1.Find user - vague eror prevents email enumberation attacks
        var user = await _userRepository.GetByEmailAsync(command.Email, ct) ?? throw new UnauthorizedAccessException("Invalid email or passoword");
        //2.Checks account is active before touching the password
        if (!user.IsActive)
            throw new ForbiddenException("Your account has been deactivated. Please contact support");
        //verify password against stored BCrypt hash
        var isValidPassword = _passwordHasher.Verify(command.Password, user.PasswordHash);
        if (!isValidPassword)
            throw new UnauthorizedException("Invalid email or password.");
            
        // Handle Two-Factor Authentication
        if (user.TwoFactorEnabled)
        {
            if (user.PreferredTwoFactorMethod == "Email")
            {
                // Generate a random 6-digit OTP and store in Redis with 5-minute TTL
                var otp = new Random().Next(100000, 999999).ToString();
                var otpKey = $"otp:{user.Id}";
                await _cache.SetStringAsync(otpKey, otp,
                    new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) });
                
                var emailResult = await _emailService.SendEmailAsync(
                    user.Email,
                    "Your CapShop Login OTP",
                    $"Your one-time password is: <b>{otp}</b>. It is valid for 5 minutes.");

                if (!emailResult.Success)
                {
                    await _cache.RemoveAsync(otpKey, ct);
                    throw new ServiceUnavailableException(
                        "We couldn't send your login OTP email right now. Please try again in a moment.");
                }

                Console.WriteLine($"[EMAIL SENT] Sent OTP to {user.Email}");
            }

            return new LoginResponseDto
            {
                RequiresTwoFactor = true,
                TwoFactorMethod = user.PreferredTwoFactorMethod
            };
        }

        //generate JWT
        var token = _jwtTokenGenerator.GenerateToken(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(60);
        return new LoginResponseDto
        {
            Token = token,
            Role = user.Role,
            ExpiresAt = expiresAt,
            RequiresTwoFactor = false,
            TwoFactorMethod = null,
            User = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                IsActive = user.IsActive,
                TwoFactorEnabled = user.TwoFactorEnabled,
                PreferredTwoFactorMethod = user.PreferredTwoFactorMethod,
                CreatedAt = user.CreatedAt
            }
        };
    }

}
