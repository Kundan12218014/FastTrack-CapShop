using CapShop.AuthService.Application.DTOs;
using CapShop.AuthService.Domain.Entities;
using CapShop.AuthService.Infrastructure.Persistence;
using CapShop.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CapShop.AuthService.Controllers
{
    [ApiController]
    [Route("auth/addresses")]
    [Produces("application/json")]
    [Authorize]
    public class AddressController : ControllerBase
    {
        private readonly AuthDbContext _context;

        public AddressController(AuthDbContext context)
        {
            _context = context;
        }

        private Guid GetUserId()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdStr, out var userId)) return userId;
            throw new UnauthorizedAccessException();
        }

        [HttpGet]
        public async Task<IActionResult> GetAddresses(CancellationToken ct)
        {
            var userId = GetUserId();
            var addresses = await _context.Addresses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AddressDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Detail = a.Detail,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync(ct);

            return Ok(ApiResponse<List<AddressDto>>.Ok(addresses));
        }

        [HttpPost]
        public async Task<IActionResult> CreateAddress([FromBody] CreateAddressRequestDto request, CancellationToken ct)
        {
            var userId = GetUserId();
            var address = Address.Create(userId, request.Title, request.Detail);
            _context.Addresses.Add(address);
            await _context.SaveChangesAsync(ct);

            var dto = new AddressDto
            {
                Id = address.Id,
                Title = address.Title,
                Detail = address.Detail,
                CreatedAt = address.CreatedAt
            };

            return Ok(ApiResponse<AddressDto>.Ok(dto, "Address added successfully"));
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateAddress(Guid id, [FromBody] UpdateAddressRequestDto request, CancellationToken ct)
        {
            var userId = GetUserId();
            var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, ct);
            
            if (address == null) return NotFound(ApiResponse<object>.Fail("Address not found"));

            address.Update(request.Title, request.Detail);
            await _context.SaveChangesAsync(ct);

            var dto = new AddressDto
            {
                Id = address.Id,
                Title = address.Title,
                Detail = address.Detail,
                CreatedAt = address.CreatedAt
            };

            return Ok(ApiResponse<AddressDto>.Ok(dto, "Address updated successfully"));
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteAddress(Guid id, CancellationToken ct)
        {
            var userId = GetUserId();
            var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, ct);
            
            if (address == null) return NotFound(ApiResponse<object>.Fail("Address not found"));

            _context.Addresses.Remove(address);
            await _context.SaveChangesAsync(ct);

            return Ok(ApiResponse<object>.Ok(new { }, "Address deleted successfully"));
        }
    }
}