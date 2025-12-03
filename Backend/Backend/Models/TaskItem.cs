namespace Backend.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        public string Title { get; set; } = null!;
        public DateTime? Start { get; set; }
        public DateTime Deadline { get; set; }
        public int? DurationDays { get; set; }
        public string? Responsible { get; set; }
        public string? Description { get; set; }
        public bool IsDone { get; set; } = false;
        public DateTime Updated { get; set; } = DateTime.UtcNow;

        public List<TaskStage> Stages { get; set; } = new();
        public List<TaskDependency> Dependencies { get; set; } = new();
    }
}
