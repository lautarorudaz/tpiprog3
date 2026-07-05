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
    public class TurnoController : ControllerBase
    {
        private readonly AppDbContext _db;
        public TurnoController(AppDbContext db) => _db = db;

        // GET api/turno/disponibles/{profesorId}
        // Retorna slots disponibles del profesor (los que NO están confirmados)
        [HttpGet("disponibles/{profesorId}")]
        public async Task<IActionResult> ObtenerDisponibles(int profesorId)
        {
            var disponibilidades = await _db.Disponibilidades
                .Where(d => d.ProfesorId == profesorId)
                .ToListAsync();

            var turnosConfirmados = await _db.Turnos
                .Where(t => t.ProfesorId == profesorId &&
                            (t.Estado == EstadoTurno.confirmado || t.Estado == EstadoTurno.pendiente_pago))
                .Select(t => new { t.Fecha, t.TurnoHorario })
                .ToListAsync();

            return Ok(new { disponibilidades, turnosConfirmados });
        }

        // POST api/turno
        // Crear un nuevo turno (reserva)
        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearTurnoDto dto)
        {
            // Verificar que el slot esté disponible
            var yaReservado = await _db.Turnos.AnyAsync(t =>
                t.ProfesorId == dto.ProfesorId &&
                t.Fecha == dto.Fecha &&
                t.TurnoHorario == dto.TurnoHorario &&
                (t.Estado == EstadoTurno.confirmado || t.Estado == EstadoTurno.pendiente_pago));

            if (yaReservado)
                return Conflict("Ese horario ya está reservado.");

            var turno = new Turno
            {
                ProfesorId    = dto.ProfesorId,
                AlumnoId      = dto.AlumnoId,
                MateriaId     = dto.MateriaId,
                Fecha         = dto.Fecha,
                TurnoHorario  = dto.TurnoHorario,
                Modalidad     = dto.Modalidad,
                Estado        = EstadoTurno.pendiente_pago
            };

            using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                _db.Turnos.Add(turno);
                await _db.SaveChangesAsync();

                // Crear el pago asociado
                _db.Pagos.Add(new Pago
                {
                    TurnoId = turno.Id,
                    Metodo  = dto.MetodoPago,
                    Estado  = EstadoPago.pendiente
                });

                // Crear conversacion alumno-profesor si no existe
                var convExistente = await _db.Conversaciones
                    .FirstOrDefaultAsync(c => c.AlumnoId == dto.AlumnoId && c.ProfesorId == dto.ProfesorId);

                if (convExistente == null)
                {
                    _db.Conversaciones.Add(new Conversacion
                    {
                        AlumnoId   = dto.AlumnoId,
                        ProfesorId = dto.ProfesorId,
                        TurnoId    = turno.Id
                    });
                }

                await _db.SaveChangesAsync();
                await tx.CommitAsync();

                return Ok(new { turno.Id, turno.Estado, mensaje = "Turno creado. Pendiente de pago." });
            }
            catch
            {
                await tx.RollbackAsync();
                return StatusCode(500, "Error al crear el turno.");
            }
        }

        // GET api/turno/alumno/{alumnoId}
        // Mis turnos (para el alumno)
        [HttpGet("alumno/{alumnoId}")]
        public async Task<IActionResult> ObtenerPorAlumno(int alumnoId)
        {
            var turnos = await _db.Turnos
                .Include(t => t.Profesor).ThenInclude(p => p.Usuario)
                .Include(t => t.Materia)
                .Include(t => t.Pago)
                .Where(t => t.AlumnoId == alumnoId)
                .OrderByDescending(t => t.Fecha)
                .Select(t => new
                {
                    t.Id,
                    t.Fecha,
                    t.TurnoHorario,
                    t.Modalidad,
                    t.Estado,
                    Materia        = t.Materia.Nombre,
                    Profesor       = $"{t.Profesor.Usuario.Nombre} {t.Profesor.Usuario.Apellido}",
                    ProfesorId     = t.ProfesorId,
                    ProfesorFoto   = t.Profesor.Usuario.FotoPerfil,
                    ConversacionId = _db.Conversaciones
                        .Where(c => c.AlumnoId == alumnoId && c.ProfesorId == t.ProfesorId)
                        .Select(c => (int?)c.Id)
                        .FirstOrDefault(),
                    Pago           = t.Pago == null ? null : new { t.Pago.Metodo, t.Pago.Estado, t.Pago.ComprobanteUrl },
                    YaCalificado   = _db.Valoraciones.Any(v => v.TurnoId == t.Id)
                })
                .ToListAsync();

            return Ok(turnos);
        }

        // GET api/turno/profesor/{profesorId}
        // Agenda del profesor
        [HttpGet("profesor/{profesorId}")]
        public async Task<IActionResult> ObtenerPorProfesor(int profesorId)
        {
            var turnos = await _db.Turnos
                .Include(t => t.Alumno).ThenInclude(a => a.Usuario)
                .Include(t => t.Materia)
                .Include(t => t.Pago)
                .Where(t => t.ProfesorId == profesorId)
                .OrderByDescending(t => t.Fecha)
                .Select(t => new
                {
                    t.Id,
                    t.Fecha,
                    t.TurnoHorario,
                    t.Modalidad,
                    t.Estado,
                    t.MotivoCancelacion,
                    Materia    = t.Materia.Nombre,
                    Alumno     = $"{t.Alumno.Usuario.Nombre} {t.Alumno.Usuario.Apellido}",
                    AlumnoId   = t.AlumnoId,
                    AlumnoFoto = t.Alumno.Usuario.FotoPerfil,
                    Pago       = t.Pago == null ? null : new { t.Pago.Metodo, t.Pago.Estado, t.Pago.ComprobanteUrl }
                })
                .ToListAsync();

            return Ok(turnos);
        }

        // PUT api/turno/{id}/estado
        // Confirmar o rechazar turno (para el profesor)
        [HttpPut("{id}/estado")]
        public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoDto dto)
        {
            var turno = await _db.Turnos.FindAsync(id);
            if (turno == null) return NotFound();

            turno.Estado = dto.Estado;
            await _db.SaveChangesAsync();

            return Ok(new { turno.Id, turno.Estado });
        }

        // PUT api/turno/{id}/cancelar
        // Cancelar un turno confirmado (profesor)
        [HttpPut("{id}/cancelar")]
        public async Task<IActionResult> Cancelar(int id, [FromBody] CancelarTurnoDto dto)
        {
            var turno = await _db.Turnos.FindAsync(id);
            if (turno == null) return NotFound();

            turno.Estado              = EstadoTurno.cancelado;
            turno.MotivoCancelacion   = dto.Motivo;
            await _db.SaveChangesAsync();

            return Ok(new { turno.Id, turno.Estado });
        }

        // POST api/turno/{id}/comprobante
        // Alumno sube comprobante de pago
        [HttpPost("{id}/comprobante")]
        public async Task<IActionResult> SubirComprobante(int id, [FromBody] ComprobanteDto dto)
        {
            var pago = await _db.Pagos.FirstOrDefaultAsync(p => p.TurnoId == id);
            if (pago == null) return NotFound();

            pago.ComprobanteUrl = dto.ComprobanteUrl;
            pago.FechaPago      = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { mensaje = "Comprobante cargado. En espera de confirmación del profesor." });
        }
    }

    // ── DTOs ────────────────────────────────────────────────
    public record CrearTurnoDto(
        [Required] int ProfesorId,
        [Required] int AlumnoId,
        [Required] int MateriaId,
        [Required] DateOnly Fecha,
        TurnoTipo TurnoHorario,
        ModalidadTipo Modalidad,
        MetodoPago MetodoPago
    );

    public record CambiarEstadoDto(EstadoTurno Estado);
    public record CancelarTurnoDto([StringLength(500)] string? Motivo);
    public record ComprobanteDto([Required] string ComprobanteUrl);
}