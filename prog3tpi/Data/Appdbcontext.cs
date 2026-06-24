using Microsoft.EntityFrameworkCore;
using TP02.Models;

namespace TP02.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // ── DbSets ──────────────────────────────────────────
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Alumno> Alumnos { get; set; }
        public DbSet<Profesor> Profesores { get; set; }
        public DbSet<Materia> Materias { get; set; }
        public DbSet<Disponibilidad> Disponibilidades { get; set; }
        public DbSet<Turno> Turnos { get; set; }
        public DbSet<DatosBancarios> DatosBancarios { get; set; }
        public DbSet<Pago> Pagos { get; set; }
        public DbSet<Conversacion> Conversaciones { get; set; }
        public DbSet<Mensaje> Mensajes { get; set; }
        public DbSet<Valoracion> Valoraciones { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ── Enums como strings en la BD ─────────────────
            modelBuilder.Entity<Usuario>()
                .Property(u => u.Rol)
                .HasConversion<string>();

            modelBuilder.Entity<Materia>()
                .Property(m => m.Nivel)
                .HasConversion<string>();

            modelBuilder.Entity<Profesor>()
                .Property(p => p.Modalidad)
                .HasConversion<string>();

            modelBuilder.Entity<Disponibilidad>()
                .Property(d => d.DiaSemana)
                .HasConversion<string>();

            modelBuilder.Entity<Disponibilidad>()
                .Property(d => d.Turno)
                .HasConversion<string>();

            modelBuilder.Entity<Turno>()
                .Property(t => t.TurnoHorario)
                .HasConversion<string>();

            modelBuilder.Entity<Turno>()
                .Property(t => t.Modalidad)
                .HasConversion<string>();

            modelBuilder.Entity<Turno>()
                .Property(t => t.Estado)
                .HasConversion<string>();

            modelBuilder.Entity<Pago>()
                .Property(p => p.Metodo)
                .HasConversion<string>();

            modelBuilder.Entity<Pago>()
                .Property(p => p.Estado)
                .HasConversion<string>();

            // ── Relaciones ───────────────────────────────────

            // Usuario → Alumno (1:1)
            modelBuilder.Entity<Alumno>()
                .HasOne(a => a.Usuario)
                .WithOne(u => u.Alumno)
                .HasForeignKey<Alumno>(a => a.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            // Usuario → Profesor (1:1)
            modelBuilder.Entity<Profesor>()
                .HasOne(p => p.Usuario)
                .WithOne(u => u.Profesor)
                .HasForeignKey<Profesor>(p => p.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            // Profesor ↔ Materia (N:N)
            modelBuilder.Entity<Profesor>()
                .HasMany(p => p.Materias)
                .WithMany(m => m.Profesores)
                .UsingEntity(j => j.ToTable("MateriaProfesor"));

            // Disponibilidad → Profesor
            modelBuilder.Entity<Disponibilidad>()
                .HasOne(d => d.Profesor)
                .WithMany(p => p.Disponibilidades)
                .HasForeignKey(d => d.ProfesorId)
                .OnDelete(DeleteBehavior.Cascade);

            // Disponibilidad única por profesor/día/turno
            modelBuilder.Entity<Disponibilidad>()
                .HasIndex(d => new { d.ProfesorId, d.DiaSemana, d.Turno })
                .IsUnique();

            // Turno → Profesor
            modelBuilder.Entity<Turno>()
                .HasOne(t => t.Profesor)
                .WithMany(p => p.Turnos)
                .HasForeignKey(t => t.ProfesorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Turno → Alumno
            modelBuilder.Entity<Turno>()
                .HasOne(t => t.Alumno)
                .WithMany(a => a.Turnos)
                .HasForeignKey(t => t.AlumnoId)
                .OnDelete(DeleteBehavior.Restrict);

            // DatosBancarios → Profesor (1:1)
            modelBuilder.Entity<DatosBancarios>()
                .HasOne(db => db.Profesor)
                .WithMany(p => p.DatosBancarios)
                .HasForeignKey(db => db.ProfesorId)
                .OnDelete(DeleteBehavior.Cascade);

            // Pago → Turno (1:1)
            modelBuilder.Entity<Pago>()
                .HasOne(p => p.Turno)
                .WithOne(t => t.Pago)
                .HasForeignKey<Pago>(p => p.TurnoId)
                .OnDelete(DeleteBehavior.Cascade);

            // Conversacion → único por alumno+profesor
            modelBuilder.Entity<Conversacion>()
                .HasIndex(c => new { c.AlumnoId, c.ProfesorId })
                .IsUnique();

            // Mensaje → Remitente (Usuario)
            modelBuilder.Entity<Mensaje>()
                .HasOne(m => m.Remitente)
                .WithMany()
                .HasForeignKey(m => m.RemitenteId)
                .OnDelete(DeleteBehavior.Restrict);

            // Valoracion: puntaje entre 1 y 5
            modelBuilder.Entity<Valoracion>()
                .ToTable(t => t.HasCheckConstraint("CK_Valoracion_Puntaje", "\"Puntaje\" >= 1 AND \"Puntaje\" <= 5"));

            // Nombres de tablas con comillas (convención PostgreSQL del SQL generado)
            modelBuilder.Entity<Usuario>().ToTable("Usuarios");
            modelBuilder.Entity<Alumno>().ToTable("Alumnos");
            modelBuilder.Entity<Profesor>().ToTable("Profesores");
            modelBuilder.Entity<Materia>().ToTable("Materias");
            modelBuilder.Entity<Disponibilidad>().ToTable("Disponibilidad");
            modelBuilder.Entity<Turno>().ToTable("Turnos");
            modelBuilder.Entity<DatosBancarios>().ToTable("DatosBancarios");
            modelBuilder.Entity<Pago>().ToTable("Pagos");
            modelBuilder.Entity<Conversacion>().ToTable("Conversaciones");
            modelBuilder.Entity<Mensaje>().ToTable("Mensajes");
            modelBuilder.Entity<Valoracion>().ToTable("Valoraciones");
        }
    }
}