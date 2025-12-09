namespace Backend.Models
{
    public class Project
    {
        public int Id { get; set; }
        public int SubjectId { get; set; }
        public Subject? Subject { get; set; }

        public string Name { get; set; } = null!;
        public DateTime? Deadline { get; set; }

        public List<TaskItem> Tasks { get; set; } = new();
        public List<Student> Team { get; set; } = new();
    }
}