using CapShop.AuthService.Application.DTOs;
using CapShop.AuthService.Domain.Entities;
using CapShop.AuthService.Domain.Interfaces;
using CapShop.Shared.Exceptions;
namespace CapShop.AuthService.Application.Commands;

public record RegisterUserCommand(string FullName, string Email, string PhoneNumber, string password, string Role = UserRoles.Customer);

public class RegisterUserCommandHandler
{
    private readonly IUserRepository userRepository;
    private readonly IPasswordHasher passwordHasher;
    public RegisterUserCommandHandler(IUserRepository userRepository,IPasswordHasher passwordHasher)
    {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;

    }
    public async Task<UserDto>Handle(RegisterUserCommand command,CancellationToken ct)
    {
        //Business rule: email must be globally unique
        var emailTaken = await userRepository.EmailExitsAsync(command.Email, ct);
        if(emailTaken )
            throw new ConflictException(
                $"An account with email '{command.Email}' already exists.");
        //Hash password -never store plain text
        var passwordHash = passwordHasher.Hash(command.password);
        //use domain factory the only legal way to construct a user

        var user = User.Create(command.FullName,
            command.Email,
            command.PhoneNumber,
            passwordHash,
            command.Role);
        //persist
        await userRepository.AddAsync(user, ct);
        await userRepository.SaveChangesAsync(ct);
        //return DTO =nver return the entity
        return ToDto(user);
    }
    private static UserDto ToDto(User user) => new()
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