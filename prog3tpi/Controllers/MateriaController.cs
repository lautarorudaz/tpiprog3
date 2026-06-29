using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TP02.Data;
using TP02.Models;

namespace TP02.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MateriaController : ControllerBase
    {
        private readonly AppDbContext _db;
        public MateriaController(AppDbContext db) => _db = db;

        // GET api/materia
        [HttpGet]
        public async Task<IActionResult> ObtenerTodas()
        {
            // Seed default materias if empty
            if (!await _db.Materias.AnyAsync())
            {
                var materias = new List<Materia>
                {
                    new Materia { Nombre = "Ciencias Naturales", Nivel = NivelTipo.primario },
                    new Materia { Nombre = "Ciencias Sociales", Nivel = NivelTipo.primario },
                    new Materia { Nombre = "Ciencias Sociales", Nivel = NivelTipo.secundario },
                    new Materia { Nombre = "Matematicas", Nivel = NivelTipo.primario },
                    new Materia { Nombre = "Matematicas", Nivel = NivelTipo.secundario },
                    new Materia { Nombre = "Matematicas", Nivel = NivelTipo.universitario },
                    new Materia { Nombre = "Fisica", Nivel = NivelTipo.secundario },
                    new Materia { Nombre = "Fisica", Nivel = NivelTipo.universitario },
                    new Materia { Nombre = "Quimica", Nivel = NivelTipo.secundario },
                    new Materia { Nombre = "Quimica", Nivel = NivelTipo.universitario },
                    new Materia { Nombre = "Algebra", Nivel = NivelTipo.universitario }
                };
                _db.Materias.AddRange(materias);
                await _db.SaveChangesAsync();
            }

            var lista = await _db.Materias.ToListAsync();
            return Ok(lista);
        }
    }
}
