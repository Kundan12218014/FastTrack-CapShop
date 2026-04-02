using CapShop.AuthService.Domain.Interfaces;
using CapShop.Shared.Exceptions;
using BCrypt.Net;

namespace CapShop.AuthService.Application.Commands
{
    public record ResetPasswordCommand(string Email, string Code, string NewPassword);

    public class ResetPasswordCommandHandler
    {
        private readonly IUserRepository _userRepository;

        public ResetPasswordCommandHandler(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<object> Handle(ResetPasswordCommand command, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByEmailAsync(command.Email, ct)
                ?? throw new UnauthorizedException("Invalid reset request.");

            if (string.IsNullOrWhiteSpace(user.CurrentOtp) || user.OtpExpiryTime < DateTime.UtcNow)
                throw new UnauthorizedException("OTP has expired or is invalid.");

            if (user.CurrentOtp != command.Code)
                throw new UnauthorizedException("Invalid OTP code.");

            // Success, hash new password
            var newHash = BCrypt.Net.BCrypt.HashPassword(command.NewPassword);
            user.UpdatePasswordHash(newHash);
            user.ClearOtp();

            await _userRepository.UpdateAsync(user, ct);
            await _userRepository.SaveChangesAsync(ct);

            return new { Message = "Password has been successfully reset." };
        }
    }
}
