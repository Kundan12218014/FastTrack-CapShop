using CapShop.Shared.Models;

namespace CapShop.AuthService.Application.DTOs
{
    public class AddressDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class CreateAddressRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
    }

    public class UpdateAddressRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
    }
}