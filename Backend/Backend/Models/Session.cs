using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Session
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid StudentId { get; set; }
        public Student? Student { get; set; }

        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        public DateTime ExpiresAt { get; set; }
    }
}
