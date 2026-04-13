using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CapShop.OrderService.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerEmailToOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomerEmail",
                schema: "orders",
                table: "Orders",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomerEmail",
                schema: "orders",
                table: "Orders");
        }
    }
}
