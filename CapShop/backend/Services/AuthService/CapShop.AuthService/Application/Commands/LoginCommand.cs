using CapShop.AuthService.Application.DTOs;
using CapShop.AuthService.Domain.Interfaces;
using CapShop.Shared.Exceptions;

namespace CapShop.AuthService.Application.Commands;
public record LoginCommand(string Email, string Password);
public class LoginCommandHandler
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    public LoginCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator
        )
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }
    public async Task<LoginResponseDto> Handle(
        LoginCommand command,
        CancellationToken ct = default)
    {
        //1.Find user - vague eror prevents email enumberation attacks
        var user = await _userRepository.GetByEmailAsync(command.Email, ct) ?? throw new UnauthorizedAccessException("Invalid email or passoword");
        //2.Checks account is active before touching the password
        if (!user.IsActive)
            throw new ForbiddenException("Your account has been deactivated. Please contact support");
        //verify password against stored BCrypt hash
        var isValidPassword = _passwordHasher.Verify(command.Password, user.PasswordHash);
        if (!isValidPassword)
            throw new UnauthorizedException("Invalid email or password.");
        //generate JWT
        var token = _jwtTokenGenerator.GenerateToken(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(60);
        return new LoginResponseDto
        {
            Token = token,
            Role = user.Role,
            ExpiresAt = expiresAt,
            User = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            }
        };
    }

}