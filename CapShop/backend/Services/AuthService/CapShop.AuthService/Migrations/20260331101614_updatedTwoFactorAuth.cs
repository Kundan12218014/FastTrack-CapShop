using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CapShop.AuthService.Migrations
{
    /// <inheritdoc />
    public partial class updatedTwoFactorAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AuthenticatorKey",
                schema: "auth",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentOtp",
                schema: "auth",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OtpExpiryTime",
                schema: "auth",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredTwoFactorMethod",
                schema: "auth",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TwoFactorEnabled",
                schema: "auth",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AuthenticatorKey",
                schema: "auth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CurrentOtp",
                schema: "auth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OtpExpiryTime",
                schema: "auth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PreferredTwoFactorMethod",
                schema: "auth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TwoFactorEnabled",
                schema: "auth",
                table: "Users");
        }
    }
}
