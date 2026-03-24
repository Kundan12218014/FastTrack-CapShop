using Moq;
using NUnit.Framework;
using CapShop.AuthService.Application.Queries;
using CapShop.AuthService.Domain.Interfaces;
using CapShop.AuthService.Domain.Entities;
using CapShop.Shared.Exceptions;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CapShop.AuthService.Tests
{
    [TestFixture]
    public class GetUserQueryHandlerTests
    {
        private Mock<IUserRepository> _userRepositoryMock;
        private GetUserQueryHandler _handler;

        [SetUp]
        public void Setup()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _handler = new GetUserQueryHandler(_userRepositoryMock.Object);
        }

        [Test]
        public async Task Handle_UserFound_ReturnsUserDto()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var query = new GetUserQuery(userId);
            var user = User.Create("John Doe", "john@example.com", "1234567890", "hash", UserRoles.Customer);

            _userRepositoryMock.Setup(repo => repo.GetByIdAsync(query.UserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

            // Act
            var result = await _handler.Handle(query);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Email, Is.EqualTo(user.Email));
            Assert.That(result.FullName, Is.EqualTo(user.FullName));
        }

        [Test]
        public async Task Handle_UserNotFound_ThrowsNotFoundException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var query = new GetUserQuery(userId);

            _userRepositoryMock.Setup(repo => repo.GetByIdAsync(query.UserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((User)null);

            // Act & Assert
            var ex = Assert.ThrowsAsync<NotFoundException>(async () => await _handler.Handle(query));
            Assert.That(ex.Message, Does.Contain("User"));
        }
    }
}