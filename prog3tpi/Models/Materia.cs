namespace TP02.Models
{
    public enum NivelTipo { primario, secundario, universitario }

    public class Materia
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public NivelTipo Nivel { get; set; }

        // Navegación
        public ICollection<Profesor> Profesores { get; set; } = new List<Profesor>();
    }
}