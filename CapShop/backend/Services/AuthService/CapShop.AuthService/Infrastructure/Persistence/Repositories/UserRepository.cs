using CapShop.AuthService.Domain.Entities;
using CapShop.AuthService.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CapShop.AuthService.Infrastructure.Persistence.Repositories;

public class UserRepository: IUserRepository
{
    private readonly AuthDbContext _context;
    public UserRepository(AuthDbContext context)=>_context=context;
    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id, ct);
    public async Task<User?>GetByEmailAsync(string email,CancellationToken ct = default)
    {
       return  await _context.Users.FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant(), ct);
    }
    public async Task<bool> EmailExitsAsync(string email, CancellationToken ct = default)
    {
        return await _context.Users.AsNoTracking().AnyAsync(u => u.Email == email.ToLowerInvariant(), ct);
    }
    public async Task AddAsync(User user, CancellationToken ct = default)
        => await _context.Users.AddAsync(user, ct);
    public Task UpdateAsync(User user, CancellationToken ct = default)
    {
        //update() marks all properties as Modified
        //Use Attach()+entry.State for partial updates.
        _context.Users.Update(user);
        return Task.CompletedTask;
    }
    public async Task SaveChangesAsync(CancellationToken ct = default)
    => await _context.SaveChangesAsync(ct);
}
