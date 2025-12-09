using Backend.DTO;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _service;
        public AuthController(IAuthService service) => _service = service;

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var (success, error, id) = await _service.RegisterAsync(dto);
            if (!success) return Conflict(new { error });
            return Created("", new { id });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var (success, error, token) = await _service.LoginAsync(dto);
            if (!success) return Unauthorized(new { error });

            Response.Cookies.Append("session", token!, new CookieOptions
            {
                HttpOnly = true,
                Path = "/",
                Expires = DateTime.UtcNow.AddMinutes(1) 
            });

            return Ok();
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var token = Request.Cookies["session"];
            if (token == null) return Unauthorized();

            var success = await _service.LogoutAsync(token);
            if (!success) return Unauthorized();

            Response.Cookies.Append("session", "", new CookieOptions
            {
                HttpOnly = true,
                Path = "/",
                Expires = DateTime.UtcNow.AddYears(-1)
            });

            return Ok();
        }

        [HttpGet("session")]
        public async Task<IActionResult> GetSession()
        {
            var sessionCookie = Request.Cookies["session"];
            if (string.IsNullOrEmpty(sessionCookie))
                return Unauthorized(new { error = "Нет сессии" });

            var student = await _service.GetStudentBySessionAsync(sessionCookie);
            if (student == null)
                return Unauthorized(new { error = "Сессия не найдена или пользователь отсутствует" });

            return Ok(new { login = student.Login });
        }

        [HttpGet("studentId")]
        public async Task<IActionResult> GetStudentId()
        {
            var sessionCookie = Request.Cookies["session"];
            if (string.IsNullOrEmpty(sessionCookie))
                return Unauthorized(new { error = "Нет сессии" });

            var student = await _service.GetStudentBySessionAsync(sessionCookie);
            if (student == null)
                return Unauthorized(new { error = "Сессия не найдена или пользователь отсутствует" });

            return Ok(new { id = student.Id });
        }
    }
}
