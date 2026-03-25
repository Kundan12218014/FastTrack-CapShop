using Microsoft.AspNetCore.Components;
/// <summary>
/// Product category entity. Pure C# — no EF references.
/// Navigation property Products is used by EF Core for
/// relationship loading — defined here but configured in DbContext.
/// </summary>
namespace CapShop.CatalogService.Domain.Entities
{
    public class Category
    {
       public int Id { get; private set; }
        public string Name { get; private set; } = string.Empty;
        public string Description { get; private set; } = string.Empty;
       public int DisplayOrder{ get; private set; }
        public bool IsActive { get; private set; } = true;

        //navigational property EF core use this joins
        public ICollection<Product> Products { get; private set; }
        private Category() { }
        public static Category Create(string name, string desciption,int displayOrder = 0)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Category name is required.", nameof(name));
            return new Category
            {
                Name = name.Trim(),
                Description = desciption.Trim(),
                DisplayOrder = displayOrder,
                IsActive = true
            };
        }
        public void Update(string name,string description,int displayOrder)
        {
            Name = name.Trim();
            Description = description.Trim();
            DisplayOrder = displayOrder;
        }
        public void Deactivate() => IsActive = false;
        public void Activate() => IsActive = true;
    }
}
