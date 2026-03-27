namespace CapShop.AdminService.Domain.Entities;

/// <summary>
/// The Admin Service reads from other services' schemas for reporting
/// and writes back order status updates and product changes.
///
/// Rather than duplicating full entities, the Admin Service uses
/// lightweight read models — just the columns it needs for its
/// specific queries. This is the CQRS read-model pattern.
///
/// In a real microservices setup you would use event sourcing or
/// a dedicated read database. For this project we use cross-schema
/// queries on the same SQL Server instance which is acceptable
/// for the training environment.
/// </summary>

/// <summary>
/// AuditLog records every admin action for compliance and debugging.
/// Every product update, order status change, and export is logged here.
/// </summary>
public class AuditLog
{
    public Guid Id { get; private set; }
    public string AdminId { get; private set; } = string.Empty;
    public string Action { get; private set; } = string.Empty;
    public string EntityType { get; private set; } = string.Empty;
    public string? EntityId { get; private set; }
    public string? Details { get; private set; }
    public DateTime PerformedAt { get; private set; }

    private AuditLog() { }

    public static AuditLog Create(
        string adminId,
        string action,
        string entityType,
        string? entityId = null,
        string? details = null) => new()
        {
            Id = Guid.NewGuid(),
            AdminId = adminId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            PerformedAt = DateTime.UtcNow
        };
}
