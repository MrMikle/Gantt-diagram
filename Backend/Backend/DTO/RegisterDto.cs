using System.ComponentModel.DataAnnotations;

namespace Backend.DTO
{
    public class RegisterDto
    {
        [Required]
        public string Login { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
