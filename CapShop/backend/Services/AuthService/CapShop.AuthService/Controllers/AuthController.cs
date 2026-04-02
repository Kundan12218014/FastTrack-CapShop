using CapShop.AuthService.Application.Commands;
using CapShop.AuthService.Application.DTOs;
using CapShop.AuthService.Application.Queries;
using CapShop.AuthService.Domain.Entities;
using CapShop.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CapShop.AuthService.Controllers;

[ApiController]
[Route("auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly RegisterUserCommandHandler _registerHandler;
    private readonly LoginCommandHandler _loginHandler;
    private readonly GetUserQueryHandler _getUserHandler;
    private readonly VerifyTwoFactorCommandHandler _verifyTwoFactorHandler;
    private readonly ManageTwoFactorCommandHandler _manageTwoFactorHandler;
    private readonly ForgotPasswordCommandHandler _forgotPasswordHandler;
    private readonly ResetPasswordCommandHandler _resetPasswordHandler;

    public AuthController(
         RegisterUserCommandHandler registerHandler,
         LoginCommandHandler loginHandler,
         GetUserQueryHandler getUserHandler,
         VerifyTwoFactorCommandHandler verifyTwoFactorHandler,
         ManageTwoFactorCommandHandler manageTwoFactorHandler,
         ForgotPasswordCommandHandler forgotPasswordHandler,
         ResetPasswordCommandHandler resetPasswordHandler)
    {
        _registerHandler = registerHandler;
        _loginHandler = loginHandler;
        _getUserHandler = getUserHandler;
        _verifyTwoFactorHandler = verifyTwoFactorHandler;
        _manageTwoFactorHandler = manageTwoFactorHandler;
        _forgotPasswordHandler = forgotPasswordHandler;
        _resetPasswordHandler = resetPasswordHandler;
    }
    [HttpPost("signup")]
    [AllowAnonymous]
    [ProducesResponseType( typeof(ApiResponse<UserDto>),StatusCodes.Status201Created)]
    [ProducesResponseType (typeof(ApiResponse<Object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof (ApiResponse<Object>),StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult>Signup(
        [FromBody]SignupRequestDto request,
        CancellationToken ct
        )
    {
        var command = new RegisterUserCommand(request.FullName, request.Email, request.PhoneNumber, request.Password);
        var userDto = await _registerHandler.Handle(command, ct);
        //201 created with Location header pointing to new resource 
        return CreatedAtAction( nameof(GetUser), new { id = userDto.Id },
            ApiResponse <UserDto>.Created( userDto, "Account created success"));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>),StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>),StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>),StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequestDto request,
        CancellationToken ct)
    {
        var command = new LoginCommand(request.Email, request.Password);
        var result = await _loginHandler.Handle(command, ct);
        
        if (result.RequiresTwoFactor)
        {
            return Ok(ApiResponse<LoginResponseDto>.Ok(result, "Two-Factor Authentication required."));
        }

        return Ok(ApiResponse<LoginResponseDto>.Ok(result,"Login Successful."));

    }

    [HttpPost("verify-two-factor")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>),StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>),StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerifyTwoFactor(
        [FromBody] VerifyTwoFactorDto request,
        CancellationToken ct)
    {
        var command = new VerifyTwoFactorCommand(request.Email, request.Code);
        var result = await _verifyTwoFactorHandler.Handle(command, ct);
        return Ok(ApiResponse<LoginResponseDto>.Ok(result, "2FA verified and login successful."));
    }

    [HttpPost("enable-two-factor")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>),StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>),StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> EnableTwoFactor(
        [FromBody] EnableTwoFactorDto request,
        CancellationToken ct)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var command = new EnableTwoFactorCommand(userId, request.Method);
        var res = await _manageTwoFactorHandler.HandleEnableAsync(command, ct);
        return Ok(ApiResponse<object>.Ok(res, "Two-Factor Authentication enabled."));
    }

    [HttpPost("disable-two-factor")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>),StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>),StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DisableTwoFactor(CancellationToken ct)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        await _manageTwoFactorHandler.HandleDisableAsync(userId, ct);
        return Ok(ApiResponse<object>.Ok(new { }, "Two-Factor Authentication disabled."));
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>),StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequestDto request,
        CancellationToken ct)
    {
        var command = new ForgotPasswordCommand(request.Email);
        var result = await _forgotPasswordHandler.Handle(command, ct);
        return Ok(ApiResponse<object>.Ok(result, "Password reset attempt processed."));
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>),StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>),StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequestDto request,
        CancellationToken ct)
    {
        var command = new ResetPasswordCommand(request.Email, request.Code, request.NewPassword);
        var result = await _resetPasswordHandler.Handle(command, ct);
        return Ok(ApiResponse<object>.Ok(result, "Password successfully reset."));
    }

    //get /auth/{id:guid}
    [HttpGet("users/{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserDto>),StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>),StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>),StatusCodes.Status404NotFound)]
    public async Task<IActionResult>GetUser(Guid id,CancellationToken ct)
    {
        var query = new GetUserQuery(id);
        var result = await _getUserHandler.Handle(query, ct);
        return Ok(ApiResponse<UserDto>.Ok(result));
    }
    //patch /auth/users/{id}/activate
    [HttpPatch("users/{id:guid}/activate")]
    [Authorize(Roles =UserRoles.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>),StatusCodes.Status404NotFound)]

    public async Task<IActionResult>ActivateUser(
        Guid id,
        [FromBody] ActivateUserRequestDto request,
        CancellationToken ct
        )
    {
        //verify user exits - throws 404 via GlobalExceptionMiddleware
        await _getUserHandler.Handle(new GetUserQuery(id), ct);
        //full implemnetaion would be an updateUserCommand 
        return NoContent();
    }

}
