using CapShop.NotificationService.Infrastructure.Persistence;
using CapShop.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CapShop.NotificationService.Controllers;

[ApiController]
[Route("notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
  private readonly NotificationDbContext _db;

  public NotificationsController(NotificationDbContext db)
  {
    _db = db;
  }

  [HttpGet]
  public async Task<IActionResult> GetMyNotifications(CancellationToken ct)
  {
    var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

    var notifs = await _db.Notifications
        .Where(n => n.UserId == userId)
        .OrderByDescending(n => n.CreatedAtUtc)
        .ToListAsync(ct);

    return Ok(ApiResponse<object>.Ok(notifs));
  }

  [HttpPost("{id:guid}/read")]
  public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
  {
    var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

    var notif = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId, ct);
    if (notif == null) return NotFound(ApiResponse<object>.Fail("Notification not found"));

    notif.IsRead = true;
    await _db.SaveChangesAsync(ct);

    return Ok(ApiResponse<object>.Ok(notif));
  }
}