using CapShop.AuthService.Domain.Interfaces;
using CapShop.Shared.Exceptions;

namespace CapShop.AuthService.Application.Commands
{
    public record ForgotPasswordCommand(string Email);

    public class ForgotPasswordCommandHandler
    {
        private readonly IUserRepository _userRepository;
        private readonly IEmailService _emailService;

        public ForgotPasswordCommandHandler(IUserRepository userRepository, IEmailService emailService)
        {
            _userRepository = userRepository;
            _emailService = emailService;
        }

        public async Task<object> Handle(ForgotPasswordCommand command, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByEmailAsync(command.Email, ct);
            if (user == null)
            {
                // To prevent email enumeration, we still return success even if user not found.
                return new { Message = "If that email is registered, a password reset code has been sent." };
            }

            var otp = new Random().Next(100000, 999999).ToString();
            user.SetOtp(otp, 10); // Expiry in 10 minutes for password reset

            await _emailService.SendEmailAsync(user.Email, "CapShop Password Reset", $"Your password reset code is: <b>{otp}</b>. It is valid for 10 minutes.");
            Console.WriteLine($"[EMAIL SENT] Sent Password Reset OTP to {user.Email}");

            await _userRepository.UpdateAsync(user, ct);
            await _userRepository.SaveChangesAsync(ct);

            return new { Message = "If that email is registered, a password reset code has been sent." };
        }
    }
}
