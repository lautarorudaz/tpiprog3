using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TP02.Data;
using TP02.Models;

namespace TP02.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuarioController : ControllerBase
    {
        private readonly AppDbContext _db;
        public UsuarioController(AppDbContext db) => _db = db;

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

            _db.Usuarios.Add(usuario);
            await _db.SaveChangesAsync();

            if (dto.Rol == RolUsuario.alumno)
                _db.Alumnos.Add(new Alumno { UsuarioId = usuario.Id });
            else
                _db.Profesores.Add(new Profesor { UsuarioId = usuario.Id, Modalidad = ModalidadTipo.presencial, PrecioHora = 0 });

            await _db.SaveChangesAsync();

            return Ok(new { usuario.Id, usuario.Rol });
        }

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
    }

    public record RegistroDto(string FirebaseUid, string Email, string? Nombre, string? Apellido, RolUsuario Rol);
}