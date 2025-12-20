using Backend.Data;
using Backend.DTO;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using BCrypt.Net;

namespace Backend.Services
{
    public interface IAuthService
    {
        Task<(bool Success, string? Error, Guid? StudentId)> RegisterAsync(RegisterDto dto);
        Task<(bool Success, string? Error, string? Token)> LoginAsync(LoginDto dto);
        Task<bool> LogoutAsync(string token);
        Task<Student?> GetStudentBySessionAsync(string token);
    }

    public class AuthService : IAuthService
    {
        private readonly AppDbContext _db;
        public AuthService(AppDbContext db) => _db = db;

        public async Task<(bool Success, string? Error, Guid? StudentId)> RegisterAsync(RegisterDto dto)
        {
            if (await _db.Students.AnyAsync(u => u.Login == dto.Login))
                return (false, "Login already exists", null);

            var student = new Student
            {
                Login = dto.Login,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            _db.Students.Add(student);
            await _db.SaveChangesAsync();
            return (true, null, student.Id);
        }

        public async Task<(bool Success, string? Error, string? Token)> LoginAsync(LoginDto dto)
        {
            var student = await _db.Students.FirstOrDefaultAsync(u => u.Login == dto.Login);
            if (student == null || !BCrypt.Net.BCrypt.Verify(dto.Password, student.PasswordHash))
                return (false, "Invalid login or password", null);

            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            var session = new Session
            {
                StudentId = student.Id,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60)
            };

            _db.Sessions.Add(session);
            await _db.SaveChangesAsync();

            return (true, null, token);
        }

        public async Task<bool> LogoutAsync(string token)
        {
            var session = await _db.Sessions.FirstOrDefaultAsync(s => s.Token == token);
            if (session == null) return false;

            _db.Sessions.Remove(session);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<Student?> GetStudentBySessionAsync(string token)
        {
            var session = await _db.Sessions.FirstOrDefaultAsync(s => s.Token == token);
            if (session == null || session.ExpiresAt < DateTime.UtcNow)
                return null;

            return await _db.Students.FindAsync(session.StudentId);
        }
    }

}
