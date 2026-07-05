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
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ChatController(AppDbContext db) => _db = db;

        // GET api/chat/profesor/{profesorId}
        [HttpGet("profesor/{profesorId}")]
        public async Task<IActionResult> ObtenerChatsProfesor(int profesorId)
        {
            var profesor = await _db.Profesores.FindAsync(profesorId);
            if (profesor == null) return NotFound("Profesor no encontrado");

            var conversacionList = await _db.Conversaciones
                .Include(c => c.Alumno).ThenInclude(a => a.Usuario)
                .Include(c => c.Mensajes)
                .Include(c => c.Turno)
                .Where(c => c.ProfesorId == profesorId)
                .ToListAsync();

            var resultado = conversacionList.Select(c => {
                var ultimoMensaje = c.Mensajes.OrderByDescending(m => m.EnviadoEn).FirstOrDefault();
                var noLeidosCount = c.Mensajes.Count(m => !m.Leido && m.RemitenteId != profesor.UsuarioId);

                return new
                {
                    ConversacionId = c.Id,
                    AlumnoId = c.AlumnoId,
                    AlumnoNombre = $"{c.Alumno.Usuario.Nombre} {c.Alumno.Usuario.Apellido}".Trim(),
                    UltimoMensaje = ultimoMensaje?.Contenido ?? "Sin mensajes",
                    FechaUltimoMensaje = ultimoMensaje?.EnviadoEn ?? c.CreadaEn,
                    NoLeidos = noLeidosCount,
                    EsSolicitud = c.Turno != null && c.Turno.Estado == EstadoTurno.pendiente_pago
                };
            }).ToList();

            return Ok(resultado);
        }

        // GET api/chat/alumno/{alumnoId}
        [HttpGet("alumno/{alumnoId}")]
        public async Task<IActionResult> ObtenerChatsAlumno(int alumnoId)
        {
            var alumno = await _db.Alumnos.Include(a => a.Usuario).FirstOrDefaultAsync(a => a.Id == alumnoId);
            if (alumno == null) return NotFound("Alumno no encontrado");

            var conversacionList = await _db.Conversaciones
                .Include(c => c.Profesor).ThenInclude(p => p.Usuario)
                .Include(c => c.Mensajes)
                .Include(c => c.Turno)
                .Where(c => c.AlumnoId == alumnoId)
                .ToListAsync();

            var resultado = conversacionList.Select(c => {
                var ultimoMensaje = c.Mensajes.OrderByDescending(m => m.EnviadoEn).FirstOrDefault();
                var noLeidosCount = c.Mensajes.Count(m => !m.Leido && m.RemitenteId != alumno.UsuarioId);

                return new
                {
                    ConversacionId     = c.Id,
                    ProfesorId         = c.ProfesorId,
                    ProfesorNombre     = $"{c.Profesor.Usuario.Nombre} {c.Profesor.Usuario.Apellido}".Trim(),
                    ProfesorFoto       = c.Profesor.Usuario.FotoPerfil,
                    UltimoMensaje      = ultimoMensaje?.Contenido ?? "Sin mensajes",
                    FechaUltimoMensaje = ultimoMensaje?.EnviadoEn ?? c.CreadaEn,
                    NoLeidos           = noLeidosCount,
                    EsSolicitud        = c.Turno != null && c.Turno.Estado == EstadoTurno.pendiente_pago
                };
            }).ToList();

            return Ok(resultado);
        }

        // GET api/chat/{conversacionId}/mensajes
        [HttpGet("{conversacionId}/mensajes")]
        public async Task<IActionResult> ObtenerMensajes(int conversacionId, [FromQuery] int? lectorId = null)
        {
            var mensajes = await _db.Mensajes
                .Include(m => m.Remitente)
                .Where(m => m.ConversacionId == conversacionId)
                .OrderBy(m => m.EnviadoEn)
                .Select(m => new
                {
                    m.Id,
                    m.ConversacionId,
                    m.RemitenteId,
                    RemitenteNombre = m.Remitente.Nombre,
                    m.Contenido,
                    m.EnviadoEn,
                    m.Leido
                })
                .ToListAsync();

            // Mark only messages sent by the OTHER person as read
            var noLeidos = await _db.Mensajes
                .Where(m => m.ConversacionId == conversacionId && !m.Leido
                       && (lectorId == null || m.RemitenteId != lectorId))
                .ToListAsync();

            if (noLeidos.Any())
            {
                foreach (var msg in noLeidos)
                    msg.Leido = true;
                await _db.SaveChangesAsync();
            }

            return Ok(mensajes);
        }

        // POST api/chat/mensaje
        [HttpPost("mensaje")]
        public async Task<IActionResult> EnviarMensaje([FromBody] EnviarMensajeDto dto)
        {
            var conversacion = await _db.Conversaciones.FindAsync(dto.ConversacionId);
            if (conversacion == null) return NotFound("Conversación no encontrada");

            var mensaje = new Mensaje
            {
                ConversacionId = dto.ConversacionId,
                RemitenteId = dto.RemitenteId,
                Contenido = dto.Contenido,
                EnviadoEn = DateTime.UtcNow,
                Leido = false
            };

            _db.Mensajes.Add(mensaje);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                mensaje.Id,
                mensaje.ConversacionId,
                mensaje.RemitenteId,
                mensaje.Contenido,
                mensaje.EnviadoEn,
                mensaje.Leido
            });
        }

    }

    public record EnviarMensajeDto(
        [Required] int ConversacionId,
        [Required] int RemitenteId,
        [Required][StringLength(2000)] string Contenido
    );
}
