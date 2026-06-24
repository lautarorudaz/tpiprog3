namespace TP02.Models
{
    public enum ModalidadTipo { presencial, Virtual, hibrida }

    public class Profesor
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public string? Descripcion { get; set; }
        public ModalidadTipo Modalidad { get; set; }
        public decimal PrecioHora { get; set; }
        public string? Zona { get; set; }
        public decimal? Latitud { get; set; }
        public decimal? Longitud { get; set; }
        public decimal ValoracionPromedio { get; set; } = 0;

        // Navegación
        public Usuario Usuario { get; set; } = null!;
        public ICollection<Materia> Materias { get; set; } = new List<Materia>();
        public ICollection<Disponibilidad> Disponibilidades { get; set; } = new List<Disponibilidad>();
        public ICollection<Turno> Turnos { get; set; } = new List<Turno>();
        public ICollection<DatosBancarios> DatosBancarios { get; set; } = new List<DatosBancarios>();
        public ICollection<Conversacion> Conversaciones { get; set; } = new List<Conversacion>();
        public ICollection<Valoracion> Valoraciones { get; set; } = new List<Valoracion>();
    }
}