using Moq;
using NUnit.Framework;
using CapShop.AuthService.Application.Commands;
using CapShop.AuthService.Domain.Interfaces;
using CapShop.AuthService.Domain.Entities;
using CapShop.Shared.Exceptions;

namespace CapShop.AuthService.Tests;

[TestFixture]
public class RegisterUserCommandHandlerTests
{
    private Mock<IUserRepository> _userRepositoryMock;
    private Mock<IPasswordHasher> _passwordHasherMock;
    private RegisterUserCommandHandler _handler;

    [SetUp]
    public void Setup()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _handler = new RegisterUserCommandHandler(_userRepositoryMock.Object, _passwordHasherMock.Object);
    }

    [Test]
    public async Task Handle_EmailAlreadyExists_ThrowsConflictException()
    {
        // Arrange
        var command = new RegisterUserCommand("John Doe", "test@test.com", "1234567890", "Password123!");
        _userRepositoryMock.Setup(repo => repo.EmailExitsAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act & Assert
        var ex = Assert.ThrowsAsync<ConflictException>(async () => await _handler.Handle(command, CancellationToken.None));
        Assert.That(ex.Message, Is.EqualTo($"An account with email '{command.Email}' already exists."));
    }

    [Test]
    public async Task Handle_ValidCommand_ReturnsUserDto()
    {
        // Arrange
        var command = new RegisterUserCommand("John Doe", "test@test.com", "1234567890", "Password123!");
        _userRepositoryMock.Setup(repo => repo.EmailExitsAsync(command.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _passwordHasherMock.Setup(h => h.Hash(command.password)).Returns("HashedPassword123!");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Email, Is.EqualTo(command.Email));
        Assert.That(result.FullName, Is.EqualTo(command.FullName));
        _userRepositoryMock.Verify(repo => repo.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
        _userRepositoryMock.Verify(repo => repo.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
