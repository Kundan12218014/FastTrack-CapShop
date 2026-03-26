using CapShop.OrderService.Application.DTOs;
using CapShop.OrderService.Domain.Entities;
using FluentValidation;

namespace CapShop.OrderService.Application.Validators;

public class AddToCartValidator : AbstractValidator<AddToCartRequestDto>
{
    public AddToCartValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required.");
        RuleFor(x => x.ProductName)
            .NotEmpty().WithMessage("Product name is required.");
        RuleFor(x => x.UnitPrice)
            .GreaterThan(0).WithMessage("Unit price must be greater than zero.");
        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be at least 1.");
    }
}

public class ShippingAddressValidator : AbstractValidator<ShippingAddressDto>
{
    public ShippingAddressValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100);
        RuleFor(x => x.AddressLine)
            .NotEmpty().WithMessage("Address line is required.")
            .MaximumLength(300);
        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required.")
            .MaximumLength(100);
        RuleFor(x => x.State)
            .NotEmpty().WithMessage("State is required.")
            .MaximumLength(100);
        RuleFor(x => x.Pincode)
            .NotEmpty().WithMessage("Pincode is required.")
            .Matches(@"^\d{6}$").WithMessage("Pincode must be exactly 6 digits.");
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Phone number is required.")
            .Matches(@"^\d{10}$").WithMessage("Phone number must be exactly 10 digits.");
    }
}

public class PlaceOrderValidator : AbstractValidator<PlaceOrderRequestDto>
{
    public PlaceOrderValidator()
    {
        RuleFor(x => x.ShippingAddress)
            .NotNull().WithMessage("Shipping address is required.")
            .SetValidator(new ShippingAddressValidator());

        RuleFor(x => x.PaymentMethod)
            .NotEmpty().WithMessage("Payment method is required.")
            .Must(m => m == PaymentMethod.UPI
                    || m == PaymentMethod.Card
                    || m == PaymentMethod.COD)
            .WithMessage("Payment method must be UPI, Card, or COD.");

        RuleFor(x => x.TransactionId)
            .NotEmpty().WithMessage("Transaction ID is required. Complete payment simulation first.");
    }
}