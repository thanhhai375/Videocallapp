using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VideoCall.Domain.Entities;
using VideoCall.Infrastructure.Data;

namespace VideoCall.Controller
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _db;
        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public UserController(AppDbContext db) { _db = db; }

        // GET /api/users/me
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var user = await _db.Users.FindAsync(CurrentUserId);
            if (user == null) return NotFound();
            return Ok(MapUser(user));
        }

        // PUT /api/users/me
        [HttpPut("me")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
        {
            var user = await _db.Users.FindAsync(CurrentUserId);
            if (user == null) return NotFound();

            if (req.Bio != null) user.Bio = req.Bio;
            if (req.ProfilePictureUrl != null) user.ProfilePictureUrl = req.ProfilePictureUrl;
            await _db.SaveChangesAsync();
            return Ok(MapUser(user));
        }

        // GET /api/users/search?phone=0901111111
        [HttpGet("search")]
        public async Task<IActionResult> SearchByPhone([FromQuery] string phone)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phone);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });
            return Ok(MapUser(user));
        }

        private static object MapUser(User u) => new
        {
            id = u.Id,
            username = u.Username,
            phoneNumber = u.PhoneNumber,
            profilePictureUrl = u.ProfilePictureUrl,
            bio = u.Bio,
            isOnline = u.IsOnline,
            lastSeenAt = u.LastSeenAt
        };

        public record UpdateProfileRequest(string? Bio, string? ProfilePictureUrl);
    }
}
