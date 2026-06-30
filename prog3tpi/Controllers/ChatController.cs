using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TP02.Data;
using TP02.Models;

namespace TP02.Controllers
{
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
            // Verify profesor exists
            var profesor = await _db.Profesores.FindAsync(profesorId);
            if (profesor == null) return NotFound("Profesor no encontrado");

            // Seed mock alumnos and conversations if none exist
            var tieneChats = await _db.Conversaciones.AnyAsync(c => c.ProfesorId == profesorId);
            if (!tieneChats)
            {
                await SembrarMockChats(profesorId);
            }

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
        public async Task<IActionResult> ObtenerMensajes(int conversacionId)
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

            // Mark all messages as read
            var noLeidos = await _db.Mensajes
                .Where(m => m.ConversacionId == conversacionId && !m.Leido)
                .ToListAsync();
            
            if (noLeidos.Any())
            {
                foreach (var msg in noLeidos)
                {
                    msg.Leido = true;
                }
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

        private async Task SembrarMockChats(int profesorId)
        {
            // Seed mock student users
            var mockAlumnosInfo = new[]
            {
                new { Nombre = "Federico", Apellido = "Zeniquel", Email = "federico@wiser.com", Uid = "mock_fed", Msg = "Hola profe", Unread = false },
                new { Nombre = "Luciano", Apellido = "Gomez", Email = "luciano@wiser.com", Uid = "mock_lu", Msg = "No hice la tarea", Unread = true },
                new { Nombre = "Mateo", Apellido = "Bosch", Email = "mateo@wiser.com", Uid = "mock_mat", Msg = "Hay clases hoy ?", Unread = false }
            };

            foreach (var info in mockAlumnosInfo)
            {
                var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == info.Email);
                if (usuario == null)
                {
                    usuario = new Usuario
                    {
                        Nombre = info.Nombre,
                        Apellido = info.Apellido,
                        Email = info.Email,
                        Rol = RolUsuario.alumno,
                        FirebaseUid = info.Uid
                    };
                    _db.Usuarios.Add(usuario);
                    await _db.SaveChangesAsync();
                }

                var alumno = await _db.Alumnos.FirstOrDefaultAsync(a => a.UsuarioId == usuario.Id);
                if (alumno == null)
                {
                    alumno = new Alumno
                    {
                        UsuarioId = usuario.Id
                    };
                    _db.Alumnos.Add(alumno);
                    await _db.SaveChangesAsync();
                }

                // Create conversation
                var conv = new Conversacion
                {
                    ProfesorId = profesorId,
                    AlumnoId = alumno.Id,
                    CreadaEn = DateTime.UtcNow.AddHours(-2)
                };
                _db.Conversaciones.Add(conv);
                await _db.SaveChangesAsync();

                // Add mock message
                var msg = new Mensaje
                {
                    ConversacionId = conv.Id,
                    RemitenteId = usuario.Id,
                    Contenido = info.Msg,
                    EnviadoEn = DateTime.UtcNow.AddMinutes(info.Unread ? -10 : -30),
                    Leido = !info.Unread
                };
                _db.Mensajes.Add(msg);
                await _db.SaveChangesAsync();
            }
        }
    }

    public record EnviarMensajeDto(int ConversacionId, int RemitenteId, string Contenido);
}
