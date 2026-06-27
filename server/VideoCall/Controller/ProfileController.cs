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
        private readonly IWebHostEnvironment _env;

        public ProfileController(AppDbContext db, IWebHostEnvironment env)
        {
            _db = db;
            _env = env;
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
                user.Job,
                user.DateOfBirth,
                user.Gender
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

            if (dto.Email != null)
                user.Email = dto.Email;
                
            if (dto.Job != null)
                user.Job = dto.Job;
                
            if (dto.DateOfBirth != null)
            {
                if (DateTime.TryParse(dto.DateOfBirth, out var parsedDate))
                {
                    user.DateOfBirth = parsedDate;
                }
            }
                
            if (dto.Gender != null)
                user.Gender = dto.Gender;

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

        // POST /api/profile/feedback - Submit bug report / feedback
        [HttpPost("feedback")]
        public async Task<IActionResult> SubmitFeedback([FromBody] SubmitFeedbackDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Description))
                return BadRequest(new { message = "Mô tả sự cố không được để trống" });

            var feedbacksPath = Path.Combine(_env.WebRootPath, "feedbacks");
            Directory.CreateDirectory(feedbacksPath);

            var feedbackData = new
            {
                Id = Guid.NewGuid(),
                UserId = CurrentUserId,
                Title = dto.Title,
                Description = dto.Description,
                ScreenshotUrl = dto.ScreenshotUrl,
                CreatedAt = DateTime.UtcNow
            };

            var jsonContent = System.Text.Json.JsonSerializer.Serialize(feedbackData, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            var filePath = Path.Combine(feedbacksPath, $"{feedbackData.Id}.json");
            await System.IO.File.WriteAllTextAsync(filePath, jsonContent);

            return Ok(new { message = "Đã gửi báo cáo sự cố thành công!" });
        }
    }

    public class UpdateProfileDto
    {
        public string? Username { get; set; }
        public string? Bio { get; set; }
        public string? Email { get; set; }
        public string? Job { get; set; }
        public string? DateOfBirth { get; set; }
        public string? Gender { get; set; }
    }

    public class UpdateAvatarDto
    {
        public string AvatarUrl { get; set; } = string.Empty;
    }

    public class SubmitFeedbackDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ScreenshotUrl { get; set; }
    }
}
