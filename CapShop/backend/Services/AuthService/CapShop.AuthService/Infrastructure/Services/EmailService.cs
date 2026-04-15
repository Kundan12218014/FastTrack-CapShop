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

    public async Task<EmailSendResult> SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var senderEmail = emailSettings["SenderEmail"];
            var senderPassword = emailSettings["SenderPassword"];
            var smtpHost = emailSettings["SmtpHost"] ?? "smtp.gmail.com";
            var stringPort = emailSettings["SmtpPort"] ?? "587";
            var smtpPort = int.Parse(stringPort);

            if (string.IsNullOrWhiteSpace(senderEmail) || string.IsNullOrWhiteSpace(senderPassword))
            {
                const string message = "SMTP sender credentials are not configured.";
                _logger.LogWarning("{Message} Email not sent to {to}.", message, to);
                return new EmailSendResult(false, message);
            }

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false
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
            return new EmailSendResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {to}", to);
            return new EmailSendResult(false, ex.Message);
        }
    }
}
