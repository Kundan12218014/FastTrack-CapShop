using CapShop.NotificationService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CapShop.NotificationService.Infrastructure.Persistence;

public class NotificationDbContext : DbContext
{
  public NotificationDbContext(DbContextOptions<NotificationDbContext> options) : base(options) { }

  public DbSet<Notification> Notifications => Set<Notification>();

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    base.OnModelCreating(modelBuilder);
    modelBuilder.HasDefaultSchema("noti");

    modelBuilder.Entity<Notification>(e =>
    {
      e.HasKey(n => n.Id);
      e.HasIndex(n => n.UserId);
      e.Property(n => n.EmailStatus).HasMaxLength(20).IsRequired();
      e.Property(n => n.EmailFailureReason).HasMaxLength(500);
    });
  }
}