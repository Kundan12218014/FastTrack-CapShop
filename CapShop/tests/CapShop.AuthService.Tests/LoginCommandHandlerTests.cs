using Moq;
using NUnit.Framework;
using CapShop.AuthService.Application.Commands;
using CapShop.AuthService.Application.DTOs;
using CapShop.AuthService.Domain.Interfaces;
using CapShop.AuthService.Domain.Entities;
using CapShop.Shared.Exceptions;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CapShop.AuthService.Tests
{
    [TestFixture]
    public class LoginCommandHandlerTests
    {
        private Mock<IUserRepository> _userRepositoryMock;
        private Mock<IPasswordHasher> _passwordHasherMock;
        private Mock<IJwtTokenGenerator> _jwtTokenGeneratorMock;
        private Mock<IEmailService> _emailServiceMock;
        private LoginCommandHandler _handler;

        [SetUp]
        public void Setup()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _passwordHasherMock = new Mock<IPasswordHasher>();
            _jwtTokenGeneratorMock = new Mock<IJwtTokenGenerator>();
            _emailServiceMock = new Mock<IEmailService>();
            var cacheMock = new Mock<Microsoft.Extensions.Caching.Distributed.IDistributedCache>();

            _handler = new LoginCommandHandler(
                _userRepositoryMock.Object,
                _passwordHasherMock.Object,
                _jwtTokenGeneratorMock.Object,
                _emailServiceMock.Object,
                cacheMock.Object);
        }

        [Test]
        public async Task Handle_UserNotFound_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var command = new LoginCommand("notfound@test.com", "password");
            _userRepositoryMock.Setup(repo => repo.GetByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
                .ReturnsAsync((User)null);

            // Act & Assert
            var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(async () => await _handler.Handle(command));
            Assert.That(ex.Message, Is.EqualTo("Invalid email or passoword"));
        }

        [Test]
        public async Task Handle_UserInactive_ThrowsForbiddenException()
        {
            // Arrange
            var command = new LoginCommand("inactive@test.com", "password");
            var inactiveUser = User.Create("Inactive User", command.Email, "123456789", "hash", UserRoles.Customer);
            inactiveUser.Deactivate(); // Simulating inactive user

            _userRepositoryMock.Setup(repo => repo.GetByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(inactiveUser);

            // Act & Assert
            var ex = Assert.ThrowsAsync<ForbiddenException>(async () => await _handler.Handle(command));
            Assert.That(ex.Message, Is.EqualTo("Your account has been deactivated. Please contact support"));
        }

        [Test]
        public async Task Handle_ValidCredentials_ReturnsLoginResponseDto()
        {
            // Arrange
            var command = new LoginCommand("valid@test.com", "correctpassword");
            var user = User.Create("Valid User", command.Email, "123456789", "hash", UserRoles.Customer);

            _userRepositoryMock.Setup(repo => repo.GetByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

            _passwordHasherMock.Setup(h => h.Verify(command.Password, "hash"))
                .Returns(true);

            _jwtTokenGeneratorMock.Setup(j => j.GenerateToken(user))
                .Returns("generated_jwt_token");

            // Act
            var result = await _handler.Handle(command);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Token, Is.EqualTo("generated_jwt_token"));
            Assert.That(result.User.Email, Is.EqualTo(command.Email));
        }

        [Test]
        public async Task Handle_InvalidPassword_ThrowsUnauthorizedException()
        {
            // Arrange
            var command = new LoginCommand("valid@test.com", "wrongpassword");
            var user = User.Create("Valid User", command.Email, "123456789", "hash", UserRoles.Customer);

            _userRepositoryMock.Setup(repo => repo.GetByEmailAsync(command.Email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

            _passwordHasherMock.Setup(h => h.Verify(command.Password, "hash"))
                .Returns(false);

            // Act & Assert
            var ex = Assert.ThrowsAsync<UnauthorizedException>(async () => await _handler.Handle(command));
            Assert.That(ex.Message, Is.EqualTo("Invalid email or password."));
        }
    }
}
