using System.Text.Json;
using CapShop.OrderService.Domain.Entities;
using CapShop.OrderService.Domain.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace CapShop.OrderService.Infrastructure.Persistence.Repositories;

public class CartRepository : ICartRepository
{
    private readonly IDistributedCache _cache;
    private const string CartKeyPrefix = "cart:";

    private static readonly DistributedCacheEntryOptions CartTtl = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7)
    };

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public CartRepository(IDistributedCache cache) => _cache = cache;

    // ── Read ──────────────────────────────────────────────────────────────

    public async Task<Cart?> GetActiveCartByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        var json = await _cache.GetStringAsync(UserKey(userId), ct);
        if (string.IsNullOrEmpty(json)) return null;

        var model = JsonSerializer.Deserialize<CartCacheModel>(json, JsonOpts);
        return model?.Status == CartStatus.Active ? model.ToDomain() : null;
    }

    public Task<Cart?> GetByIdAsync(Guid cartId, CancellationToken ct = default)
        // Redis is keyed by userId; callers should use GetActiveCartByUserIdAsync.
        => Task.FromResult<Cart?>(null);

    // ── Write ─────────────────────────────────────────────────────────────

    public async Task AddAsync(Cart cart, CancellationToken ct = default)
    {
        var model = CartCacheModel.FromDomain(cart);
        var json = JsonSerializer.Serialize(model, JsonOpts);
        await _cache.SetStringAsync(UserKey(cart.UserId), json, CartTtl, ct);
    }

    public async Task DeleteAsync(Guid userId, CancellationToken ct = default)
        => await _cache.RemoveAsync(UserKey(userId), ct);

    // SaveChangesAsync is a no-op — Redis writes are immediate in AddAsync.
    public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;

    // ── Helpers ───────────────────────────────────────────────────────────

    private static string UserKey(Guid userId) => $"{CartKeyPrefix}{userId}";
}