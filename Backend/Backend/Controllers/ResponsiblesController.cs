using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;
[ApiController]
[Route("api/[controller]")]
public class ResponsiblesController : ControllerBase
{
    private readonly AppDbContext _db;
    public ResponsiblesController(AppDbContext db) => _db = db;

    [HttpPost("{projectId}")]
    public async Task<IActionResult> Add(int projectId, Responsible r)
    {
        r.ProjectId = projectId;
        _db.Responsibles.Add(r);
        await _db.SaveChangesAsync();
        return Ok(r);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var r = await _db.Responsibles.FindAsync(id);
        if (r == null) return NotFound();
        _db.Responsibles.Remove(r);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}