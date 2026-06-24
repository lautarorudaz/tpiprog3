namespace TP02.Models
{
    public enum RolUsuario { alumno, profesor }
 
    public class Usuario
    {
        public int Id { get; set; }
        public string FirebaseUid { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string? FotoPerfil { get; set; }
        public RolUsuario Rol { get; set; }
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
 
        // Navegación
        public Alumno? Alumno { get; set; }
        public Profesor? Profesor { get; set; }
 
        public string NombreCompleto => $"{Nombre} {Apellido}";
    }
}
 