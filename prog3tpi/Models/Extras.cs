namespace TP02.Models
{
    public enum DiaSemana { lunes, martes, miercoles, jueves, viernes, sabado, domingo }
    public enum TurnoTipo { manana, tarde, noche }
    public enum EstadoTurno { pendiente_pago, confirmado, rechazado, cancelado }
    public enum MetodoPago { transferencia, efectivo }
    public enum EstadoPago { pendiente, confirmado, rechazado }

    // ── Disponibilidad ──────────────────────────────────────
    public class Disponibilidad
    {
        public int Id { get; set; }
        public int ProfesorId { get; set; }
        public DiaSemana DiaSemana { get; set; }
        public TurnoTipo Turno { get; set; }
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

        public Profesor Profesor { get; set; } = null!;
    }

    // ── Turno ───────────────────────────────────────────────
    public class Turno
    {
        public int Id { get; set; }
        public int ProfesorId { get; set; }
        public int AlumnoId { get; set; }
        public int MateriaId { get; set; }
        public DateOnly Fecha { get; set; }
        public TurnoTipo TurnoHorario { get; set; }
        public ModalidadTipo Modalidad { get; set; }
        public EstadoTurno Estado { get; set; } = EstadoTurno.pendiente_pago;
        public string? MotivoCancelacion { get; set; }
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

        public Profesor Profesor { get; set; } = null!;
        public Alumno Alumno { get; set; } = null!;
        public Materia Materia { get; set; } = null!;
        public Pago? Pago { get; set; }
    }

    // ── Datos Bancarios ─────────────────────────────────────
    public class DatosBancarios
    {
        public int Id { get; set; }
        public int ProfesorId { get; set; }
        public string? CBU { get; set; }
        public string? Alias { get; set; }
        public string Titular { get; set; } = string.Empty;
        public string? Banco { get; set; }
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

        public Profesor Profesor { get; set; } = null!;
    }

    // ── Pago ────────────────────────────────────────────────
    public class Pago
    {
        public int Id { get; set; }
        public int TurnoId { get; set; }
        public MetodoPago Metodo { get; set; }
        public EstadoPago Estado { get; set; } = EstadoPago.pendiente;
        public string? ComprobanteUrl { get; set; }
        public DateTime? FechaPago { get; set; }

        public Turno Turno { get; set; } = null!;
    }

    // ── Conversacion ────────────────────────────────────────
    public class Conversacion
    {
        public int Id { get; set; }
        public int AlumnoId { get; set; }
        public int ProfesorId { get; set; }
        public int? TurnoId { get; set; }
        public DateTime CreadaEn { get; set; } = DateTime.UtcNow;

        public Alumno Alumno { get; set; } = null!;
        public Profesor Profesor { get; set; } = null!;
        public Turno? Turno { get; set; }
        public ICollection<Mensaje> Mensajes { get; set; } = new List<Mensaje>();
    }

    // ── Mensaje ─────────────────────────────────────────────
    public class Mensaje
    {
        public int Id { get; set; }
        public int ConversacionId { get; set; }
        public int RemitenteId { get; set; }
        public string Contenido { get; set; } = string.Empty;
        public DateTime EnviadoEn { get; set; } = DateTime.UtcNow;
        public bool Leido { get; set; } = false;

        public Conversacion Conversacion { get; set; } = null!;
        public Usuario Remitente { get; set; } = null!;
    }

    // ── Valoracion ──────────────────────────────────────────
    public class Valoracion
    {
        public int Id { get; set; }
        public int TurnoId { get; set; }
        public int AlumnoId { get; set; }
        public int ProfesorId { get; set; }
        public int Puntaje { get; set; }   // 1 a 5
        public string? Comentario { get; set; }
        public DateTime FechaValoracion { get; set; } = DateTime.UtcNow;

        public Turno Turno { get; set; } = null!;
        public Alumno Alumno { get; set; } = null!;
        public Profesor Profesor { get; set; } = null!;
    }
}