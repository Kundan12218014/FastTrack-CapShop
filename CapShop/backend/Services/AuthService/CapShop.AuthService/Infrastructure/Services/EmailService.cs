using System.Net;
using System.Net.Mail;
using CapShop.AuthService.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CapShop.AuthService.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var senderEmail = emailSettings["SenderEmail"];
            var senderPassword = emailSettings["SenderPassword"];
            var smtpHost = emailSettings["SmtpHost"] ?? "smtp.gmail.com";
            var stringPort = emailSettings["SmtpPort"] ?? "587";
            var smtpPort = int.Parse(stringPort);

            if (string.IsNullOrEmpty(senderPassword))
            {
                _logger.LogWarning("Email password not set. Email not sent.");
                return;
            }

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            mailMessage.To.Add(to);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Email sent successfully to {to}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {to}", to);
            // In a robust system, you might want to rethrow or push to a dead-letter queue.
        }
    }
}
