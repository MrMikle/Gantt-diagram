namespace Backend.Models
{
    public class Subject
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public List<Project> Projects { get; set; } = new();
    }
}