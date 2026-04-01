using CapShop.AuthService.Application.DTOs;
using CapShop.AuthService.Domain.Interfaces;
using CapShop.Shared.Exceptions;
using OtpNet;
using System.Security.Cryptography;

namespace CapShop.AuthService.Application.Commands;

public record EnableTwoFactorCommand(Guid UserId, string Method);

public class ManageTwoFactorCommandHandler
{
    private readonly IUserRepository _userRepository;

    public ManageTwoFactorCommandHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<object> HandleEnableAsync(EnableTwoFactorCommand command, CancellationToken ct = default)
    {
        var user = await _userRepository.GetByIdAsync(command.UserId, ct)
            ?? throw new NotFoundException("User not found.");

        if (command.Method != "Email" && command.Method != "Authenticator")
            throw new ArgumentException("Method must be 'Email' or 'Authenticator'");

        user.EnableTwoFactor(command.Method);

        string? manualKey = null;
        string? qrCodeUri = null;

        if (command.Method == "Authenticator")
        {
            // Generate a random Base32 string for the Authenticator app using Otp.NET
            var keyBytes = KeyGeneration.GenerateRandomKey(20);
            manualKey = Base32Encoding.ToString(keyBytes);

            user.SetAuthenticatorKey(manualKey);
            qrCodeUri = $"otpauth://totp/CapShop:{user.Email}?secret={manualKey}&issuer=CapShop";
        }

        await _userRepository.UpdateAsync(user, ct);
        await _userRepository.SaveChangesAsync(ct);

        return new
        {
            Message = "Two-Factor Authentication enabled successfully.",
            Method = user.PreferredTwoFactorMethod,
            AuthenticatorKey = manualKey,
            QrCodeUri = qrCodeUri
        };
    }

    public async Task HandleDisableAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException("User not found.");

        user.DisableTwoFactor();

        await _userRepository.UpdateAsync(user, ct);
        await _userRepository.SaveChangesAsync(ct);
    }
}
