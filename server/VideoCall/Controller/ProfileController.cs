using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VideoCall.Infrastructure.Data;

namespace VideoCall.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ProfileController(AppDbContext db)
        {
            _db = db;
        }

        private Guid CurrentUserId =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET /api/profile
        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var user = await _db.Users.FindAsync(CurrentUserId);
            if (user == null) return NotFound();

            return Ok(new
            {
                user.Id,
                user.Username,
                user.PhoneNumber,
                user.Email,
                user.ProfilePictureUrl,
                user.Bio,
                user.IsOnline,
                user.LastSeenAt,
                user.CreatedAt,
            });
        }

        // PUT /api/profile
        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var user = await _db.Users.FindAsync(CurrentUserId);
            if (user == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Username))
            {
                // Check uniqueness
                var taken = await _db.Users
                    .AnyAsync(u => u.Username == dto.Username && u.Id != CurrentUserId);
                if (taken)
                    return BadRequest(new { message = "Tên này đã được dùng bởi người khác" });
                user.Username = dto.Username;
            }

            if (dto.Bio != null)
                user.Bio = dto.Bio;

            if (!string.IsNullOrWhiteSpace(dto.Email))
                user.Email = dto.Email;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công", user.Username, user.Bio });
        }

        // PUT /api/profile/avatar
        [HttpPut("avatar")]
        public async Task<IActionResult> UpdateAvatar([FromBody] UpdateAvatarDto dto)
        {
            var user = await _db.Users.FindAsync(CurrentUserId);
            if (user == null) return NotFound();

            user.ProfilePictureUrl = dto.AvatarUrl;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Ảnh đại diện đã được cập nhật", avatarUrl = dto.AvatarUrl });
        }
    }

    public class UpdateProfileDto
    {
        public string? Username { get; set; }
        public string? Bio { get; set; }
        public string? Email { get; set; }
    }

    public class UpdateAvatarDto
    {
        public string AvatarUrl { get; set; } = string.Empty;
    }
}
