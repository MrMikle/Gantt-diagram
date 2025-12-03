using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;
[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _db;
    public TasksController(AppDbContext db) => _db = db;

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var t = await _db.Tasks
            .Include(x => x.Stages)
            .Include(x => x.Dependencies)
            .FirstOrDefaultAsync(x => x.Id == id);
        return t == null ? NotFound() : Ok(t);
    }

    [HttpPost]
    public async Task<IActionResult> Create(TaskItem task)
    {
        var deps = task.Dependencies;
        task.Dependencies = null;

        var stages = task.Stages;
        task.Stages = null;

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();

        if (deps != null)
        {
            foreach (var d in deps)
            {
                d.TaskId = task.Id;
                _db.Dependencies.Add(d);
            }
        }

        if (stages != null)
        {
            foreach (var st in stages)
            {
                st.TaskItemId = task.Id;
                _db.Stages.Add(st);
            }
        }

        await _db.SaveChangesAsync();

        var full = await _db.Tasks
            .Include(t => t.Dependencies)
            .Include(t => t.Stages)
            .FirstAsync(t => t.Id == task.Id);

        return CreatedAtAction(nameof(Get), new { id = task.Id }, full);
    }

    [HttpPut("{id}/done")]
    public async Task<IActionResult> UpdateDone(int id, [FromBody] bool isDone)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task == null) return NotFound();
        task.IsDone = isDone;
        await _db.SaveChangesAsync();
        return Ok(task);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskItem updated)
    {
        var task = await _db.Tasks
            .Include(t => t.Stages)
            .Include(t => t.Dependencies)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task == null) return NotFound();

        task.Title = updated.Title;
        task.Start = updated.Start;
        task.Deadline = updated.Deadline;
        task.Responsible = updated.Responsible;
        task.Description = updated.Description;
        task.IsDone = updated.IsDone;

        if (updated.Stages != null)
        {
            var oldStages = task.Stages.ToList();
            var updatedIds = updated.Stages.Select(s => s.Id).ToHashSet();
            var toDelete = oldStages.Where(s => !updatedIds.Contains(s.Id));
            _db.Stages.RemoveRange(toDelete);

            foreach (var st in updated.Stages)
            {
                if (st.Id == 0)
                {
                    st.TaskItemId = id;
                    _db.Stages.Add(st);
                }
                else
                {
                    var existing = oldStages.First(x => x.Id == st.Id);
                    existing.Title = st.Title;
                    existing.DurationDays = st.DurationDays;
                    existing.IsDone = st.IsDone;
                }
            }
        }

        if (updated.Dependencies != null)
        {
            task.Dependencies.Clear();
            await _db.SaveChangesAsync();

            foreach (var d in updated.Dependencies)
            {
                d.TaskId = id;
                _db.Dependencies.Add(d);
            }

            await _db.SaveChangesAsync();
        }

        await _db.SaveChangesAsync();
        return Ok(task);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var t = await _db.Tasks.FindAsync(id);
        if (t == null) return NotFound();
        _db.Tasks.Remove(t);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{taskId}/stages")]
    public async Task<IActionResult> AddStage(int taskId, TaskStage stage)
    {
        stage.TaskItemId = taskId;
        _db.Stages.Add(stage);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = taskId }, stage);
    }

    [HttpPost("{taskId}/dependencies")]
    public async Task<IActionResult> AddDependency(int taskId, TaskDependency dep)
    {
        dep.TaskId = taskId;
        _db.Dependencies.Add(dep);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = taskId }, dep);
    }
}