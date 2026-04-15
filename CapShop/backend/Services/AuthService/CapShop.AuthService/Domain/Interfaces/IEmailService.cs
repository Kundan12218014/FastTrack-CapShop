namespace CapShop.AuthService.Domain.Interfaces;

public interface IEmailService
{
    Task<EmailSendResult> SendEmailAsync(string to, string subject, string body);
}
