namespace Backend.Models
{
    public class TaskStage
    {
        public int Id { get; set; }
        public int TaskItemId { get; set; }
        public TaskItem? Task { get; set; }

        public string Title { get; set; } = null!;
        public int DurationDays { get; set; }
        public bool IsDone { get; set; }
    }
}
