using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubjectsController : Controller
    {
        private readonly AppDbContext _db;
        public SubjectsController(AppDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var subjects = await _db.Subjects
                .Include(s => s.Projects)
                    .ThenInclude(p => p.Tasks) // <-- добавляем задачи
                .Include(s => s.Projects)
                    .ThenInclude(p => p.Responsibles) // если есть отдельная сущность
                .ToListAsync();

            return Ok(subjects);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            return await _db.Subjects.Include(s => s.Projects).FirstOrDefaultAsync(s => s.Id == id) is Subject s
                ? Ok(s)
                : NotFound();
        }

        [HttpPost]
        public async Task<IActionResult> Create(Subject subject)
        {
            _db.Subjects.Add(subject);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = subject.Id }, subject);
        }

        [HttpGet("{id}/projects")]
        public async Task<IActionResult> GetProjects(int id)
        {
            var projects = await _db.Projects
                .Where(p => p.SubjectId == id)
                .Include(p => p.Tasks)
                .Include(p => p.Responsibles)
                .ToListAsync();

            return Ok(projects);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var s = await _db.Subjects.FindAsync(id);
            if (s == null) return NotFound();
            _db.Subjects.Remove(s);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
