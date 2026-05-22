using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VideoCall.Infrastructure.Data;

namespace VideoCall.Controller
{
    [ApiController]
    [Route("api/calls")]
    [Authorize]
    public class CallLogController : ControllerBase
    {
        private readonly AppDbContext _db;
        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public CallLogController(AppDbContext db) { _db = db; }

        // GET /api/calls
        [HttpGet]
        public async Task<IActionResult> GetCallHistory()
        {
            var calls = await _db.CallLogs
                .Include(c => c.Caller)
                .Include(c => c.Receiver)
                .Where(c => c.CallerId == CurrentUserId || c.ReceiverId == CurrentUserId)
                .OrderByDescending(c => c.StartedAt)
                .Take(50)
                .Select(c => new
                {
                    id = c.Id,
                    callType = c.CallType.ToString(),
                    status = c.Status.ToString(),
                    startedAt = c.StartedAt,
                    durationSeconds = c.DurationSeconds,
                    isCaller = c.CallerId == CurrentUserId,
                    otherUser = c.CallerId == CurrentUserId
                        ? new { id = c.Receiver.Id, username = c.Receiver.Username, c.Receiver.ProfilePictureUrl }
                        : new { id = c.Caller.Id, username = c.Caller.Username, c.Caller.ProfilePictureUrl }
                })
                .ToListAsync();

            return Ok(calls);
        }
    }
}
