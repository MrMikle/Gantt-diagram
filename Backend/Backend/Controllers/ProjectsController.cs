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
            .Include(p => p.Responsibles)
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
    public async Task<IActionResult> Create(Project project)
    {
        _db.Projects.Add(project);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = project.Id }, project);
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
}