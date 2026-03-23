using System.ComponentModel.DataAnnotations;
namespace CapShop.AuthService.Application.DTOs
{
    //request DTO 
    //DataAnnonation=first validation pass(model binding layer)
    //FluentValidation validtors=second richer pass(businses rules)
    public class SignupRequestDto
    {
        [Required(ErrorMessage ="FullName is Required.")]
        [StringLength(100,MinimumLength =2)]
        public string FullName { get; set; } = string.Empty;


        [Required(ErrorMessage ="Email is Required.")]
        [EmailAddress(ErrorMessage ="Enter a valid email address")]
        [StringLength(200)]
        public string Email { get; set; } = string.Empty;


        [Required(ErrorMessage ="Phone number is required.")]
        [RegularExpression(@"^\d{10}$",ErrorMessage ="Phone number must be exactly 10 digits.")]
        public string PhoneNumber { get; set; } = string.Empty;
        [Required(ErrorMessage ="Password is required.")]
        [StringLength(100,MinimumLength =8,ErrorMessage ="Password must be at least 8 characters.")]
        public String Password { get; set; } = string.Empty;
    }
    public class LoginRequestDto
    {
        [Required(ErrorMessage ="Email is required.")]
        [EmailAddress(ErrorMessage ="Enter a valid email address.")]
        public string Email { get; set; } = string.Empty;
        [Required(ErrorMessage ="Password is required.")]
        public string Password { get; set; } = string.Empty;
    }
    public class UpdateProfileRequestDto
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string FullName { get; set; } = string.Empty;
        [Required]
        [RegularExpression(@"^\d{10}$")]
        public string PhoneNumber { get; set; } = string.Empty;
    }
    public class ActivateUserRequestDto
        {
        [Required]
        public bool IsActive { get; set; }
    }
    //never expose the User entity form a contoller
    //Always map to a dto =prevent accidental PasswordHash exposure.
    public class UserDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
        public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public UserDto User { get; set; } = null;
        public DateTime  ExpiresAt{ get; set; }
    }
}
