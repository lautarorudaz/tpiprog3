using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TP02.Data;
using TP02.Models;

namespace TP02.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsuarioController : ControllerBase
    {
        private readonly AppDbContext _db;
        public UsuarioController(AppDbContext db) => _db = db;

        [AllowAnonymous]
        [HttpPost("registro")]
        public async Task<IActionResult> Registro([FromBody] RegistroDto dto)
        {
            // DEBUG - borrar después
            Console.WriteLine($"=== REGISTRO RECIBIDO ===");
            Console.WriteLine($"FirebaseUid: {dto?.FirebaseUid}");
            Console.WriteLine($"Email: {dto?.Email}");
            Console.WriteLine($"Nombre: {dto?.Nombre}");
            Console.WriteLine($"Apellido: {dto?.Apellido}");
            Console.WriteLine($"Rol: {dto?.Rol}");
            Console.WriteLine($"========================");

            if (dto == null)
                return BadRequest("Body vacío");

            if (dto.FirebaseUid == null || dto.Email == null)
                return BadRequest($"FirebaseUid o Email nulos. UID: {dto.FirebaseUid}, Email: {dto.Email}");

            if (await _db.Usuarios.AnyAsync(u => u.FirebaseUid == dto.FirebaseUid))
                return Conflict("El usuario ya está registrado.");

            var usuario = new Usuario
            {
                FirebaseUid = dto.FirebaseUid,
                Email       = dto.Email,
                Nombre      = dto.Nombre ?? "",
                Apellido    = dto.Apellido ?? "",
                Rol         = dto.Rol
            };

            using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                _db.Usuarios.Add(usuario);
                await _db.SaveChangesAsync();

                if (dto.Rol == RolUsuario.alumno)
                    _db.Alumnos.Add(new Alumno { UsuarioId = usuario.Id });
                else
                    _db.Profesores.Add(new Profesor { UsuarioId = usuario.Id, Modalidad = ModalidadTipo.presencial, PrecioHora = 0 });

                await _db.SaveChangesAsync();
                await tx.CommitAsync();

                return Ok(new { usuario.Id, usuario.Rol });
            }
            catch
            {
                await tx.RollbackAsync();
                return StatusCode(500, "Error al registrar el usuario.");
            }
        }

        [AllowAnonymous]
        [HttpGet("firebase/{firebaseUid}")]
        public async Task<IActionResult> ObtenerPorFirebase(string firebaseUid)
        {
            var usuario = await _db.Usuarios
                .Include(u => u.Alumno)
                .Include(u => u.Profesor)
                .FirstOrDefaultAsync(u => u.FirebaseUid == firebaseUid);

            if (usuario == null) return NotFound();

            return Ok(usuario);
        }

        // PUT api/usuario/{id}
        // Editar datos básicos de la cuenta (nombre, apellido, foto de perfil)
        [HttpPut("{id}")]
        public async Task<IActionResult> EditarCuenta(int id, [FromBody] EditarCuentaDto dto)
        {
            var usuario = await _db.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound();

            usuario.Nombre = dto.Nombre;
            usuario.Apellido = dto.Apellido;
            if (dto.FotoPerfil != null) usuario.FotoPerfil = dto.FotoPerfil;

            await _db.SaveChangesAsync();
            return Ok(usuario);
        }
    }

    public record RegistroDto(
        [Required] string FirebaseUid,
        [Required][EmailAddress] string Email,
        [StringLength(100)] string? Nombre,
        [StringLength(100)] string? Apellido,
        RolUsuario Rol
    );
    public record EditarCuentaDto(
        [Required][StringLength(100)] string Nombre,
        [Required][StringLength(100)] string Apellido,
        string? FotoPerfil
    );
}