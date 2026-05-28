using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VideoCall.Application.Services;
using VideoCall.Domain.Entities;
using VideoCall.Infrastructure.Data;

namespace VideoCall.Controller
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly JwtService _jwtService;

        public AuthController(AppDbContext db, JwtService jwtService)
        {
            _db = db;
            _jwtService = jwtService;
        }

        // POST /api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.PhoneNumber) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { message = "Vui lòng điền đầy đủ thông tin" });

            if (req.Password.Length < 6)
                return BadRequest(new { message = "Mật khẩu phải có ít nhất 6 ký tự" });

            if (await _db.Users.AnyAsync(u => u.PhoneNumber == req.PhoneNumber))
                return Conflict(new { message = "Số điện thoại này đã được đăng ký" });

            if (await _db.Users.AnyAsync(u => u.Username == req.Username))
                return Conflict(new { message = "Tên người dùng đã tồn tại" });

            var user = new User
            {
                Username = req.Username.Trim(),
                PhoneNumber = req.PhoneNumber.Trim(),
                Email = req.Email?.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = await _jwtService.GenerateRefreshToken(user.Id, HttpContext);

            return StatusCode(201, new
            {
                accessToken,
                refreshToken = refreshToken.Token,
                user = MapUserDto(user)
            });
        }

        // POST /api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u =>
                u.PhoneNumber == req.PhoneNumber || u.Username == req.PhoneNumber);

            if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Unauthorized(new { message = "Số điện thoại/Tên đăng nhập hoặc mật khẩu không đúng" });

            if (!user.IsActive)
                return Forbid();

            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = await _jwtService.GenerateRefreshToken(user.Id, HttpContext);

            return Ok(new
            {
                accessToken,
                refreshToken = refreshToken.Token,
                user = MapUserDto(user)
            });
        }

        // POST /api/auth/refresh
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest req)
        {
            var storedToken = await _db.RefreshTokens
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Token == req.RefreshToken);

            if (storedToken == null || !storedToken.IsActive)
                return Unauthorized(new { message = "Token không hợp lệ hoặc đã hết hạn" });

            // Rotate: revoke old, issue new
            storedToken.RevokedAt = DateTime.UtcNow;
            var newRefreshToken = await _jwtService.GenerateRefreshToken(storedToken.UserId, HttpContext);
            storedToken.ReplacedByToken = newRefreshToken.Token;
            await _db.SaveChangesAsync();

            var accessToken = _jwtService.GenerateAccessToken(storedToken.User);

            return Ok(new
            {
                accessToken,
                refreshToken = newRefreshToken.Token
            });
        }

        // POST /api/auth/logout
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshRequest req)
        {
            await _jwtService.RevokeRefreshToken(req.RefreshToken);
            return Ok(new { message = "Đã đăng xuất thành công" });
        }

        private static object MapUserDto(User u) => new
        {
            id = u.Id,
            username = u.Username,
            phoneNumber = u.PhoneNumber,
            profilePictureUrl = u.ProfilePictureUrl,
            bio = u.Bio,
            role = u.Role
        };
    }

    public record RegisterRequest(string Username, string PhoneNumber, string Password, string? Email);
    public record LoginRequest(string PhoneNumber, string Password);
    public record RefreshRequest(string RefreshToken);
}
