using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TP02.Data;
using TP02.Models;

namespace TP02.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ValoracionController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ValoracionController(AppDbContext db) => _db = db;

        // GET api/valoracion/profesor/{profesorId}
        [HttpGet("profesor/{profesorId}")]
        public async Task<IActionResult> ObtenerPorProfesor(int profesorId)
        {
            var valoraciones = await _db.Valoraciones
                .Include(v => v.Alumno).ThenInclude(a => a.Usuario)
                .Where(v => v.ProfesorId == profesorId)
                .OrderByDescending(v => v.FechaValoracion)
                .Select(v => new
                {
                    v.Id,
                    v.Puntaje,
                    v.Comentario,
                    v.FechaValoracion,
                    Alumno = $"{v.Alumno.Usuario.Nombre} {v.Alumno.Usuario.Apellido}".Trim(),
                    AlumnoFoto = v.Alumno.Usuario.FotoPerfil
                })
                .ToListAsync();

            return Ok(valoraciones);
        }

        // POST api/valoracion
        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearValoracionDto dto)
        {
            var turno = await _db.Turnos.FindAsync(dto.TurnoId);
            if (turno == null) return NotFound("Turno no encontrado.");
            if (turno.Estado != EstadoTurno.confirmado)
                return BadRequest("Solo se pueden calificar turnos confirmados.");
            if (turno.AlumnoId != dto.AlumnoId)
                return Forbid();

            if (await _db.Valoraciones.AnyAsync(v => v.TurnoId == dto.TurnoId))
                return Conflict("Este turno ya tiene una calificación.");

            var valoracion = new Valoracion
            {
                TurnoId          = dto.TurnoId,
                AlumnoId         = dto.AlumnoId,
                ProfesorId       = dto.ProfesorId,
                Puntaje          = dto.Puntaje,
                Comentario       = dto.Comentario,
                FechaValoracion  = DateTime.UtcNow
            };

            _db.Valoraciones.Add(valoracion);
            await _db.SaveChangesAsync();

            // Recalcular valoración promedio del profesor
            var promedio = await _db.Valoraciones
                .Where(v => v.ProfesorId == dto.ProfesorId)
                .AverageAsync(v => (double)v.Puntaje);

            var profesor = await _db.Profesores.FindAsync(dto.ProfesorId);
            if (profesor != null)
            {
                profesor.ValoracionPromedio = (decimal)promedio;
                await _db.SaveChangesAsync();
            }

            return Ok(new { valoracion.Id, valoracion.Puntaje, valoracion.Comentario });
        }
    }

    public record CrearValoracionDto(
        int TurnoId,
        int AlumnoId,
        int ProfesorId,
        int Puntaje,
        string? Comentario
    );
}
