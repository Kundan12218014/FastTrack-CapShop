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
    public AuthController(
         RegisterUserCommandHandler registerHandler,
         LoginCommandHandler loginHandler,
         GetUserQueryHandler getUserHandler)
    {
        _registerHandler = registerHandler;
        _loginHandler = loginHandler;
        _getUserHandler = getUserHandler;
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
        return Ok(ApiResponse<LoginResponseDto>.Ok(result,"Login Successful."));

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
