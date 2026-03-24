using CapShop.AuthService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
namespace CapShop.AuthService.Infrastructure.Persistence
{
    public class AuthDbContext : DbContext
    {
        public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options) { }
        public DbSet<User> Users => Set<User>();
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.HasDefaultSchema("auth");
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                //primary key are set in the own Guid in the domain factory
                entity.HasKey(u => u.Id);
                entity.Property(u => u.Id)
                       .ValueGeneratedNever();
                entity.Property(u => u.FullName)
                .IsRequired()
                .HasMaxLength(100);

                entity.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(200);

                entity.Property(u => u.PhoneNumber)
                .IsRequired()
                .HasMaxLength(15);

                entity.Property(u => u.PasswordHash)
                .IsRequired()
                .HasMaxLength(500);

                entity.Property(u => u.Role)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue(UserRoles.Customer);

                entity.Property(u => u.IsActive)
                .HasDefaultValue(true);

                entity.Property(u => u.CreatedAt)
                .IsRequired();
                entity.Property(u => u.UpdatedAt)
                .IsRequired();

                //Unique index on email = db-level backup to the appliaiton level check in RegisterUserCommandHandler
                entity.HasIndex(u => u.Email)
                .IsUnique()
                .HasDatabaseName("IX_Users_Email");

                //Index on role =speed up admin user lookup queries
                entity.HasIndex(u => u.Role)
                .HasDatabaseName("IX_Users_Role");

                
            });
        }

    }
}
