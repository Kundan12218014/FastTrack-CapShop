using System.Net;
using System.Net.Mail;
using CapShop.Shared.Contracts.Orders;

namespace CapShop.NotificationService.Infrastructure.Services;

public class OrderEmailService
{
  private readonly IConfiguration _configuration;
  private readonly ILogger<OrderEmailService> _logger;

  public OrderEmailService(IConfiguration configuration, ILogger<OrderEmailService> logger)
  {
    _configuration = configuration;
    _logger = logger;
  }

  public async Task<EmailSendResult> SendOrderPlacedAcknowledgementAsync(OrderPlacedIntegrationEvent evt, CancellationToken ct)
  {
    try
    {
      var emailSettings = _configuration.GetSection("EmailSettings");
      var senderEmail = emailSettings["SenderEmail"];
      var senderPassword = emailSettings["SenderPassword"];
      var smtpHost = emailSettings["SmtpHost"] ?? "smtp.gmail.com";
      var smtpPortString = emailSettings["SmtpPort"] ?? "587";

      if (string.IsNullOrWhiteSpace(senderEmail) || string.IsNullOrWhiteSpace(senderPassword))
      {
        _logger.LogWarning("EmailSettings are not fully configured. Skipping order acknowledgement email for order {OrderNumber}.", evt.OrderNumber);
        return new EmailSendResult(false, "SMTP sender credentials are not configured.");
      }

      if (string.IsNullOrWhiteSpace(evt.CustomerEmail))
      {
        _logger.LogWarning("Customer email missing in OrderPlaced event for order {OrderNumber}.", evt.OrderNumber);
        return new EmailSendResult(false, "Customer email missing from order event.");
      }

      if (!int.TryParse(smtpPortString, out var smtpPort))
      {
        smtpPort = 587;
      }

      using var client = new SmtpClient(smtpHost, smtpPort)
      {
        Credentials = new NetworkCredential(senderEmail, senderPassword),
        EnableSsl = true
      };

      using var mailMessage = new MailMessage
      {
        From = new MailAddress(senderEmail),
        Subject = $"Order Confirmed: {evt.OrderNumber}",
        Body = $"Hello,<br/><br/>Thank you for shopping with CapShop. Your order <b>{evt.OrderNumber}</b> has been placed successfully.<br/>Total Amount: <b>{evt.TotalAmount:C}</b><br/>Payment Method: {evt.PaymentMethod}<br/>Items: {evt.ItemCount}<br/><br/>We will notify you when your order is packed and shipped.<br/><br/>Regards,<br/>CapShop Team",
        IsBodyHtml = true
      };

      mailMessage.To.Add(evt.CustomerEmail);

      using var registration = ct.Register(() => client.SendAsyncCancel());
      await client.SendMailAsync(mailMessage);

      _logger.LogInformation("Order acknowledgement email sent to {Email} for order {OrderNumber}.", evt.CustomerEmail, evt.OrderNumber);
      return new EmailSendResult(true);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Failed to send order acknowledgement email to {Email} for order {OrderNumber}.", evt.CustomerEmail, evt.OrderNumber);
      return new EmailSendResult(false, ex.Message);
    }
  }
}
