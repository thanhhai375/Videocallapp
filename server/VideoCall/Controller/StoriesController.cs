using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VideoCall.Domain.Entities;
using VideoCall.Infrastructure.Data;

namespace VideoCall.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StoriesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public StoriesController(AppDbContext db)
        {
            _db = db;
        }

        private Guid CurrentUserId =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET /api/stories — stories of friends + own (last 24h)
        [HttpGet]
        public async Task<IActionResult> GetStories()
        {
            var userId = CurrentUserId;

            // Get friend IDs
            var friendIds = await _db.Friendships
                .Where(f => f.User1Id == userId || f.User2Id == userId)
                .Select(f => f.User1Id == userId ? f.User2Id : f.User1Id)
                .ToListAsync();

            // Include own stories
            friendIds.Add(userId);

            var stories = await _db.Stories
                .Include(s => s.User)
                .Include(s => s.Views)
                .Where(s => friendIds.Contains(s.UserId) && s.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    s.Id,
                    s.TextContent,
                    s.MediaUrl,
                    s.MediaType,
                    s.BackgroundColor,
                    s.ViewCount,
                    s.CreatedAt,
                    s.ExpiresAt,
                    IsOwn = s.UserId == userId,
                    HasSeen = s.Views.Any(v => v.ViewerId == userId),
                    User = new { s.User.Id, s.User.Username, s.User.ProfilePictureUrl }
                })
                .ToListAsync();

            // Group by user
            var grouped = stories
                .GroupBy(s => s.User.Id)
                .Select(g => new
                {
                    User = g.First().User,
                    HasUnseen = g.Any(s => !s.HasSeen && !s.IsOwn),
                    Stories = g.ToList()
                })
                .ToList();

            return Ok(grouped);
        }

        // POST /api/stories — create a new story
        [HttpPost]
        public async Task<IActionResult> CreateStory([FromBody] CreateStoryDto dto)
        {
            var story = new Story
            {
                UserId = CurrentUserId,
                TextContent = dto.TextContent,
                MediaUrl = dto.MediaUrl,
                MediaType = dto.MediaType ?? "Text",
                BackgroundColor = dto.BackgroundColor ?? "#0084FF",
            };

            _db.Stories.Add(story);
            await _db.SaveChangesAsync();

            return Ok(new { story.Id, story.CreatedAt, story.ExpiresAt });
        }

        // POST /api/stories/{id}/view — mark story as viewed
        [HttpPost("{id}/view")]
        public async Task<IActionResult> ViewStory(Guid id)
        {
            var userId = CurrentUserId;
            var story = await _db.Stories.FindAsync(id);
            if (story == null) return NotFound();

            var alreadyViewed = await _db.StoryViews
                .AnyAsync(sv => sv.StoryId == id && sv.ViewerId == userId);

            if (!alreadyViewed)
            {
                _db.StoryViews.Add(new StoryView { StoryId = id, ViewerId = userId });
                story.ViewCount++;
                await _db.SaveChangesAsync();
            }

            return Ok();
        }

        // DELETE /api/stories/{id} — delete own story
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStory(Guid id)
        {
            var story = await _db.Stories.FindAsync(id);
            if (story == null || story.UserId != CurrentUserId)
                return NotFound();

            _db.Stories.Remove(story);
            await _db.SaveChangesAsync();
            return Ok();
        }
    }

    public class CreateStoryDto
    {
        public string? TextContent { get; set; }
        public string? MediaUrl { get; set; }
        public string? MediaType { get; set; }
        public string? BackgroundColor { get; set; }
    }
}
