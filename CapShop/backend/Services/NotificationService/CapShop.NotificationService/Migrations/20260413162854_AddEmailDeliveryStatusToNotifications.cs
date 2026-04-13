using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CapShop.NotificationService.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailDeliveryStatusToNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmailFailureReason",
                schema: "noti",
                table: "Notifications",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailStatus",
                schema: "noti",
                table: "Notifications",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailFailureReason",
                schema: "noti",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "EmailStatus",
                schema: "noti",
                table: "Notifications");
        }
    }
}
