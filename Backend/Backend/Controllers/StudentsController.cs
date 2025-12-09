using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;
[ApiController]
[Route("api/[controller]")]
public class StudentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public StudentsController(AppDbContext db) => _db = db;

    [HttpGet("{id}/projects")]
    public async Task<IActionResult> GetProjects(Guid id)
    {
        var student = await _db.Students
            .Include(s => s.Projects)
                .ThenInclude(p => p.Tasks)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (student == null) return NotFound();

        return Ok(student.Projects);
    }
}
