using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;
[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProjectsController(AppDbContext db) => _db = db;

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var proj = await _db.Projects
            .Include(p => p.Tasks).ThenInclude(t => t.Stages)
            .Include(p => p.Team)
            .FirstOrDefaultAsync(p => p.Id == id);
        return proj == null ? NotFound() : Ok(proj);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Project updatedProject)
    {
        var existing = await _db.Projects.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = updatedProject.Name;
        existing.Deadline = updatedProject.Deadline;

        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] Project project,
        [FromQuery] Guid? creatorId,
        [FromQuery] int? subjectId)
    {
        if (subjectId != null)
            project.SubjectId = subjectId.Value;

        if (project.Team == null)
            project.Team = new List<Student>();

        if (creatorId != null)
        {
            var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == creatorId.Value);
            if (student != null)
                project.Team.Add(student);
        }

        _db.Projects.Add(project);

        await _db.SaveChangesAsync();

        var projWithTeam = await _db.Projects
            .Include(p => p.Team)
            .FirstOrDefaultAsync(p => p.Id == project.Id);

        return CreatedAtAction(nameof(Get), new { id = project.Id }, projWithTeam);
    }

    [HttpGet("{projectId}/tasks")]
    public async Task<IActionResult> GetTasks(int projectId)
    {
        var tasks = await _db.Tasks
            .Where(t => t.ProjectId == projectId)
            .Include(t => t.Stages)
            .Include(t => t.Dependencies)
            .ToListAsync();

        return Ok(tasks);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _db.Projects.FindAsync(id);
        if (p == null) return NotFound();
        _db.Projects.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{projectId}/addStudent")]
    public async Task<IActionResult> AddStudent(int projectId, [FromBody] AddStudentRequest request)
    {
        var project = await _db.Projects
            .Include(p => p.Team)
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project == null)
            return NotFound(new { error = "Проект не найден" });

        var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == request.StudentId);
        if (student == null)
            return NotFound(new { error = "Студент не найден" });

        if (project.Team == null)
            project.Team = new List<Student>();

        if (project.Team.Any(s => s.Id == student.Id))
            return BadRequest(new { error = "Студент уже в команде" });

        project.Team.Add(student);
        await _db.SaveChangesAsync();

        return Ok(student);
    }

    public class AddStudentRequest
    {
        public Guid StudentId { get; set; }
    }

    [HttpGet("{id}/team")]
    public async Task<IActionResult> GetTeam(int id)
    {
        var project = await _db.Projects
            .Include(p => p.Team)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null) return NotFound();
        return Ok(project.Team.Select(s => new { s.Id, s.Login }));
    }
}