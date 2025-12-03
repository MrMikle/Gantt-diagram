namespace Backend.Models
{
    public class Responsible
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public Project? Project { get; set; }
        public string Name { get; set; } = null!;
    }
}
