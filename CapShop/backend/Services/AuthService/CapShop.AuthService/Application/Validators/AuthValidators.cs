using CapShop.AuthService.Application.DTOs;
using FluentValidation;

namespace CapShop.AuthService.Application.Validators
{
    public class SignupRequestValidator:AbstractValidator<SignupRequestDto>
    {
        public SignupRequestValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Full name is required")
                .Length(2, 100).WithMessage("Full name must be 2-100 characters.")
                .Matches(@"^[a-zA-Z\s'\-]+$")
                .WithMessage("Full name can only contain letters , spaces hypen and apostrophes.");
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Enter a valid email address.")
                .MaximumLength(200);
            RuleFor(x => x.PhoneNumber)
                .NotEmpty().WithMessage("Phone Nubmer is required.")
                .Matches(@"^\d{10}$").WithMessage("Phone number must be exactly 10 digits.");
            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required.")
                .MinimumLength(8).WithMessage("Password must be at lest 8 characters")
                .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
                .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter.")
                .Matches(@"[0-9]").WithMessage("Password must contain at least one digit.")
                .Matches(@"[^a-zA-Z0-9]")
                .WithMessage("Password must contain at least one special character");
        }
        public class LoginRequestValidator: AbstractValidator<LoginRequestDto>
        {
            public LoginRequestValidator()
            {
                RuleFor(x => x.Email)
                    .NotEmpty().WithMessage("Email is required")
                    .EmailAddress().WithMessage("Enter a valid email address.");
                RuleFor(x => x.Password)
                    .NotEmpty().WithMessage("Password is required");
            }
        }

    }
}
