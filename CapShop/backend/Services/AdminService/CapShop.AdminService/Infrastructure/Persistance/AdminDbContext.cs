using CapShop.AdminService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace CapShop.AdminService.Infrastructure.Persistence;

/// <summary>
/// The Admin Service DbContext has two responsibilities:
///
///  1. Owns the AuditLog table in the "admin" schema.
///
///  2. Reads from other services' schemas (catalog, orders, auth) via
///     raw SQL queries using FromSqlRaw() and FromSqlInterpolated().
///     We use the same SQL Server instance so cross-schema reads work.
///
/// This approach is acceptable for the training environment.
/// In production you would use event-driven data replication
/// (e.g. Azure Service Bus + read-model projections).
/// </summary>
public class AdminDbContext : DbContext
{
    public AdminDbContext(DbContextOptions<AdminDbContext> options)
        : base(options) { }

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("admin");

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AuditLogs");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Id).ValueGeneratedNever();
            entity.Property(a => a.AdminId).IsRequired().HasMaxLength(100);
            entity.Property(a => a.Action).IsRequired().HasMaxLength(100);
            entity.Property(a => a.EntityType).IsRequired().HasMaxLength(50);
            entity.Property(a => a.EntityId).HasMaxLength(100);
            entity.Property(a => a.Details).HasMaxLength(2000);
            entity.Property(a => a.PerformedAt).IsRequired();

            entity.HasIndex(a => a.AdminId)
                  .HasDatabaseName("IX_AuditLogs_AdminId");
            entity.HasIndex(a => a.PerformedAt)
                  .HasDatabaseName("IX_AuditLogs_PerformedAt");
        });
    }
}