using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TP02.Data;
using TP02.Models;

namespace TP02.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProfesorController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ProfesorController(AppDbContext db) => _db = db;

        // GET api/profesor
        // Buscar profesores con filtros opcionales
        [HttpGet]
        public async Task<IActionResult> Buscar(
            [FromQuery] string? nombre,
            [FromQuery] int? materiaId,
            [FromQuery] string? zona,
            [FromQuery] decimal? precioMaximo,
            [FromQuery] ModalidadTipo? modalidad)
        {
            var query = _db.Profesores
                .Include(p => p.Usuario)
                .Include(p => p.Materias)
                .Include(p => p.Disponibilidades)
                .AsQueryable();

            if (!string.IsNullOrEmpty(nombre))
                query = query.Where(p =>
                    p.Usuario.Nombre.ToLower().Contains(nombre.ToLower()) ||
                    p.Usuario.Apellido.ToLower().Contains(nombre.ToLower()));

            if (materiaId.HasValue)
                query = query.Where(p => p.Materias.Any(m => m.Id == materiaId));

            if (!string.IsNullOrEmpty(zona))
                query = query.Where(p => p.Zona != null && p.Zona.ToLower().Contains(zona.ToLower()));

            if (precioMaximo.HasValue)
                query = query.Where(p => p.PrecioHora <= precioMaximo);

            if (modalidad.HasValue)
                query = query.Where(p => p.Modalidad == modalidad);

            var resultado = await query.Select(p => new
            {
                p.Id,
                p.Usuario.Nombre,
                p.Usuario.Apellido,
                p.Usuario.FotoPerfil,
                p.Titulo,
                p.Descripcion,
                p.Modalidad,
                p.PrecioHora,
                p.Zona,
                p.Latitud,
                p.Longitud,
                p.ValoracionPromedio,
                Materias = p.Materias.Select(m => new { m.Id, m.Nombre, m.Nivel })
            }).ToListAsync();

            return Ok(resultado);
        }

        // GET api/profesor/{id}
        // Perfil completo de un profesor
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(int id)
        {
            var profesor = await _db.Profesores
                .Include(p => p.Usuario)
                .Include(p => p.Materias)
                .Include(p => p.Disponibilidades)
                .Include(p => p.DatosBancarios)
                .Include(p => p.Valoraciones)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (profesor == null) return NotFound();

            return Ok(new
            {
                profesor.Id,
                profesor.Usuario.Nombre,
                profesor.Usuario.Apellido,
                profesor.Usuario.FotoPerfil,
                profesor.Titulo,
                profesor.Descripcion,
                profesor.Modalidad,
                profesor.PrecioHora,
                profesor.Zona,
                profesor.Latitud,
                profesor.Longitud,
                profesor.ValoracionPromedio,
                Materias        = profesor.Materias.Select(m => new { m.Id, m.Nombre, m.Nivel }),
                Disponibilidades = profesor.Disponibilidades.Select(d => new { d.DiaSemana, d.Turno }),
                TieneDatosBancarios = profesor.DatosBancarios.Any()
            });
        }

        // GET api/profesor/{id}/datosbancarios
        [HttpGet("{id}/datosbancarios")]
        public async Task<IActionResult> ObtenerDatosBancarios(int id)
        {
            var datos = await _db.DatosBancarios.FirstOrDefaultAsync(d => d.ProfesorId == id);
            if (datos == null) return NotFound("El profesor aún no cargó sus datos bancarios.");
            return Ok(new { cbu = datos.CBU, alias = datos.Alias, banco = datos.Banco, titular = datos.Titular });
        }

        // PUT api/profesor/{id}/datosbancarios
        [HttpPut("{id}/datosbancarios")]
        public async Task<IActionResult> GuardarDatosBancarios(int id, [FromBody] DatosBancariosDto dto)
        {
            var datos = await _db.DatosBancarios.FirstOrDefaultAsync(d => d.ProfesorId == id);
            if (datos == null)
            {
                datos = new DatosBancarios { ProfesorId = id };
                _db.DatosBancarios.Add(datos);
            }
            datos.CBU     = dto.Cbu?.Trim();
            datos.Alias   = dto.Alias?.Trim();
            datos.Banco   = dto.Banco?.Trim();
            datos.Titular = dto.Titular?.Trim() ?? string.Empty;
            await _db.SaveChangesAsync();
            return Ok(new { mensaje = "Datos bancarios guardados." });
        }

        // PUT api/profesor/{id}
        // Editar perfil del profesor
        [HttpPut("{id}")]
        public async Task<IActionResult> Editar(int id, [FromBody] EditarProfesorDto dto)
        {
            var profesor = await _db.Profesores
                .Include(p => p.Materias)
                .Include(p => p.Disponibilidades)
                .Include(p => p.Usuario)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (profesor == null) return NotFound();

            // Datos del usuario
            profesor.Usuario.Nombre    = dto.Nombre;
            profesor.Usuario.Apellido  = dto.Apellido;
            if (dto.FotoPerfil != null) profesor.Usuario.FotoPerfil = dto.FotoPerfil;

            // Datos del profesor
            profesor.Titulo      = dto.Titulo;
            profesor.Descripcion = dto.Descripcion;
            profesor.Modalidad   = dto.Modalidad;
            profesor.PrecioHora  = dto.PrecioHora;
            profesor.Zona        = dto.Zona;
            profesor.Latitud     = dto.Latitud;
            profesor.Longitud    = dto.Longitud;

            // Actualizar materias
            var materias = await _db.Materias.Where(m => dto.MateriaIds.Contains(m.Id)).ToListAsync();
            profesor.Materias.Clear();
            foreach (var m in materias) profesor.Materias.Add(m);

            // Actualizar disponibilidades
            _db.Disponibilidades.RemoveRange(profesor.Disponibilidades);
            foreach (var disp in dto.Disponibilidades)
            {
                _db.Disponibilidades.Add(new Disponibilidad
                {
                    ProfesorId = id,
                    DiaSemana  = disp.DiaSemana,
                    Turno      = disp.Turno
                });
            }

            await _db.SaveChangesAsync();
            return Ok(new { mensaje = "Perfil actualizado correctamente." });
        }
    }

    // ── DTOs ────────────────────────────────────────────────
    public record DisponibilidadDto(DiaSemana DiaSemana, TurnoTipo Turno);

    public record EditarProfesorDto(
        string Nombre,
        string Apellido,
        string? FotoPerfil,
        string? Titulo,
        string? Descripcion,
        ModalidadTipo Modalidad,
        decimal PrecioHora,
        string? Zona,
        decimal? Latitud,
        decimal? Longitud,
        List<int> MateriaIds,
        List<DisponibilidadDto> Disponibilidades
    );

    public record DatosBancariosDto(string? Cbu, string? Alias, string? Banco, string? Titular);
}
