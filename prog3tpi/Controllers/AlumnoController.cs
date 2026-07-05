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
    public class AlumnoController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AlumnoController(AppDbContext db) => _db = db;

        // PUT api/alumno/{id}
        // Editar perfil del alumno
        [HttpPut("{id}")]
        public async Task<IActionResult> Editar(int id, [FromBody] EditarAlumnoDto dto)
        {
            var alumno = await _db.Alumnos
                .Include(a => a.Usuario)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (alumno == null) return NotFound();

            alumno.Usuario.Nombre   = dto.Nombre;
            alumno.Usuario.Apellido = dto.Apellido;
            if (dto.FotoPerfil != null) alumno.Usuario.FotoPerfil = dto.FotoPerfil;
            alumno.ZonaDeseada = dto.ZonaDeseada;
            alumno.Latitud     = dto.Latitud;
            alumno.Longitud    = dto.Longitud;

            await _db.SaveChangesAsync();
            return Ok(new { mensaje = "Perfil actualizado correctamente." });
        }

        // GET api/alumno/{id}
        // Perfil del alumno
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(int id)
        {
            var alumno = await _db.Alumnos
                .Include(a => a.Usuario)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (alumno == null) return NotFound();

            return Ok(new
            {
                alumno.Id,
                alumno.Usuario.Nombre,
                alumno.Usuario.Apellido,
                alumno.Usuario.Email,
                alumno.Usuario.FotoPerfil,
                alumno.ZonaDeseada,
                alumno.Latitud,
                alumno.Longitud
            });
        }
    }

    public record EditarAlumnoDto(
        [Required][StringLength(100)] string Nombre,
        [Required][StringLength(100)] string Apellido,
        string? FotoPerfil,
        [StringLength(200)] string? ZonaDeseada,
        [Range(-90, 90)] decimal? Latitud,
        [Range(-180, 180)] decimal? Longitud
    );
}
