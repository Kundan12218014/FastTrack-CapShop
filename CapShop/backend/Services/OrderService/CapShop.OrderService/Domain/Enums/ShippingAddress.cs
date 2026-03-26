namespace CapShop.OrderService.Domain.ValueObjects;

/// <summary>
/// Shipping address value object.
/// Stored as owned entity by EF Core — no separate table.
/// All columns are embedded directly in the Orders table.
///
/// Value objects are immutable — no setters, created via constructor.
/// They represent a concept, not an identity — two addresses with the
/// same data are considered equal regardless of which Order they belong to.
/// </summary>
public class ShippingAddress
{
    public string FullName { get; private set; } = string.Empty;
    public string AddressLine { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public string State { get; private set; } = string.Empty;
    public string Pincode { get; private set; } = string.Empty;
    public string PhoneNumber { get; private set; } = string.Empty;

    // EF Core requires parameterless constructor for owned entities
    private ShippingAddress() { }

    public ShippingAddress(
        string fullName,
        string addressLine,
        string city,
        string state,
        string pincode,
        string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new ArgumentException("Full name is required.", nameof(fullName));
        if (string.IsNullOrWhiteSpace(addressLine))
            throw new ArgumentException("Address line is required.", nameof(addressLine));
        if (string.IsNullOrWhiteSpace(city))
            throw new ArgumentException("City is required.", nameof(city));
        if (string.IsNullOrWhiteSpace(state))
            throw new ArgumentException("State is required.", nameof(state));
        if (!System.Text.RegularExpressions.Regex.IsMatch(pincode, @"^\d{6}$"))
            throw new ArgumentException("Pincode must be exactly 6 digits.", nameof(pincode));
        if (string.IsNullOrWhiteSpace(phoneNumber))
            throw new ArgumentException("Phone number is required.", nameof(phoneNumber));

        FullName = fullName.Trim();
        AddressLine = addressLine.Trim();
        City = city.Trim();
        State = state.Trim();
        Pincode = pincode.Trim();
        PhoneNumber = phoneNumber.Trim();
    }
}