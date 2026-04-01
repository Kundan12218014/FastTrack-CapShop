using CapShop.AuthService.Application.DTOs;
using CapShop.AuthService.Domain.Interfaces;
using CapShop.Shared.Exceptions;
using OtpNet;

namespace CapShop.AuthService.Application.Commands;

public record VerifyTwoFactorCommand(string Email, string Code);

public class VerifyTwoFactorCommandHandler
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public VerifyTwoFactorCommandHandler(IUserRepository userRepository, IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<LoginResponseDto> Handle(VerifyTwoFactorCommand command, CancellationToken ct = default)
    {
        var user = await _userRepository.GetByEmailAsync(command.Email, ct)
            ?? throw new UnauthorizedAccessException("Invalid request.");

        if (!user.TwoFactorEnabled || !user.IsActive)
            throw new UnauthorizedException("2FA is not enabled or account is inactive.");

        if (user.PreferredTwoFactorMethod == "Email")
        {
            if (string.IsNullOrWhiteSpace(user.CurrentOtp) || user.OtpExpiryTime < DateTime.UtcNow)
                throw new UnauthorizedException("OTP has expired or is invalid. Please login again.");

            if (user.CurrentOtp != command.Code)
                throw new UnauthorizedException("Invalid OTP code.");

            // OTP verified successfully
            user.ClearOtp();
            await _userRepository.UpdateAsync(user, ct);
            await _userRepository.SaveChangesAsync(ct);
        }
        else if (user.PreferredTwoFactorMethod == "Authenticator")
        {
            if (string.IsNullOrEmpty(user.AuthenticatorKey))
                throw new UnauthorizedException("Authenticator not configured.");

            var totp = new Totp(Base32Encoding.ToBytes(user.AuthenticatorKey));
            bool isValid = totp.VerifyTotp(command.Code, out long timeStepMatched, window: new VerificationWindow(previous: 1, future: 1));
            
            if (!isValid)
                throw new UnauthorizedException("Invalid Authenticator code.");
        }
        else
        {
            throw new InvalidOperationException("Unknown 2FA method.");
        }

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
