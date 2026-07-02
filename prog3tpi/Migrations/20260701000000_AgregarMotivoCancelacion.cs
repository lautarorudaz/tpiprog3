using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TP02.Migrations
{
    /// <inheritdoc />
    public partial class AgregarMotivoCancelacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MotivoCancelacion",
                table: "Turnos",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MotivoCancelacion",
                table: "Turnos");
        }
    }
}
