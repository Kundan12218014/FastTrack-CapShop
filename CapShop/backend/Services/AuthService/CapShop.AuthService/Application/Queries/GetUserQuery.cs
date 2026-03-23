using CapShop.AuthService.Application.DTOs;
using CapShop.AuthService.Domain.Interfaces;
using CapShop.Shared.Exceptions;

namespace CapShop.AuthService.Application.Queries;

public record GetUserQuery(Guid UserId);
public class GetUserQueryHandler
{
    private readonly IUserRepository _userRepository;
    public GetUserQueryHandler(IUserRepository userRepository)
    {
        _userRepository=userRepository;
    }
    public async Task<UserDto>Handle(
        GetUserQuery query,
        CancellationToken ct = default)
    {
        var user = await _userRepository.GetByIdAsync(query.UserId, ct) ?? throw new NotFoundException("User", query.UserId);
        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }
}
