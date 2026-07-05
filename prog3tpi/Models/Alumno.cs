namespace TP02.Models
{
    public class Alumno
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public string? ZonaDeseada { get; set; }
        public decimal? Latitud { get; set; }
        public decimal? Longitud { get; set; }
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

        // Navegación
        public Usuario Usuario { get; set; } = null!;
        public ICollection<Turno> Turnos { get; set; } = new List<Turno>();
        public ICollection<Conversacion> Conversaciones { get; set; } = new List<Conversacion>();
        public ICollection<Valoracion> Valoraciones { get; set; } = new List<Valoracion>();
    }
}