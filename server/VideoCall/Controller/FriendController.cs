using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VideoCall.Domain.Entities;
using VideoCall.Infrastructure.Data;

namespace VideoCall.Controller
{
    [ApiController]
    [Route("api/friends")]
    [Authorize]
    public class FriendController : ControllerBase
    {
        private readonly AppDbContext _db;
        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public FriendController(AppDbContext db) { _db = db; }

        // POST /api/friends/request
        [HttpPost("request")]
        public async Task<IActionResult> SendRequest([FromBody] FriendRequestBody req)
        {
            // Find target by phone
            var target = await _db.Users.FirstOrDefaultAsync(u => u.PhoneNumber == req.PhoneNumber);
            if (target == null) return NotFound(new { message = "Không tìm thấy người dùng với số điện thoại này" });

            if (target.Id == CurrentUserId)
                return BadRequest(new { message = "Không thể kết bạn với chính mình" });

            // Check if already friends
            var alreadyFriends = await _db.Friendships.AnyAsync(f =>
                (f.User1Id == CurrentUserId && f.User2Id == target.Id) ||
                (f.User1Id == target.Id && f.User2Id == CurrentUserId));
            if (alreadyFriends) return Conflict(new { message = "Đã là bạn bè" });

            // Check existing pending request
            var exists = await _db.FriendRequests.AnyAsync(r =>
                r.SenderId == CurrentUserId && r.ReceiverId == target.Id &&
                r.Status == FriendRequestStatus.Pending);
            if (exists) return Conflict(new { message = "Lời mời đã được gửi, đang chờ xác nhận" });

            // Check if they blocked you
            var blocked = await _db.BlockedUsers.AnyAsync(b =>
                b.BlockerId == target.Id && b.BlockedId == CurrentUserId);
            if (blocked) return NotFound(new { message = "Không tìm thấy người dùng" });

            var friendRequest = new FriendRequest
            {
                SenderId = CurrentUserId,
                ReceiverId = target.Id,
                Message = req.Message
            };
            _db.FriendRequests.Add(friendRequest);
            await _db.SaveChangesAsync();

            return Ok(new { message = $"Đã gửi lời mời kết bạn đến {target.Username}!" });
        }

        // POST /api/friends/request-by-id/{userId}
        [HttpPost("request-by-id/{userId}")]
        public async Task<IActionResult> SendRequestById(Guid userId)
        {
            var target = await _db.Users.FindAsync(userId);
            if (target == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            if (target.Id == CurrentUserId)
                return BadRequest(new { message = "Không thể kết bạn với chính mình" });

            // Check if already friends
            var alreadyFriends = await _db.Friendships.AnyAsync(f =>
                (f.User1Id == CurrentUserId && f.User2Id == target.Id) ||
                (f.User1Id == target.Id && f.User2Id == CurrentUserId));
            if (alreadyFriends) return Conflict(new { message = "Đã là bạn bè" });

            // Check existing pending request
            var exists = await _db.FriendRequests.AnyAsync(r =>
                r.SenderId == CurrentUserId && r.ReceiverId == target.Id &&
                r.Status == FriendRequestStatus.Pending);
            if (exists) return Conflict(new { message = "Lời mời đã được gửi, đang chờ xác nhận" });

            // Check if they blocked you
            var blocked = await _db.BlockedUsers.AnyAsync(b =>
                b.BlockerId == target.Id && b.BlockedId == CurrentUserId);
            if (blocked) return NotFound(new { message = "Không tìm thấy người dùng" });

            var friendRequest = new FriendRequest
            {
                SenderId = CurrentUserId,
                ReceiverId = target.Id,
                Message = "Xin chào, mình kết bạn nhé!"
            };
            _db.FriendRequests.Add(friendRequest);
            await _db.SaveChangesAsync();

            return Ok(new { message = $"Đã gửi lời mời kết bạn đến {target.Username}!" });
        }

        // GET /api/friends/pending
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var requests = await _db.FriendRequests
                .Include(r => r.Sender)
                .Where(r => r.ReceiverId == CurrentUserId && r.Status == FriendRequestStatus.Pending)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    id = r.Id,
                    sender = new { id = r.Sender.Id, username = r.Sender.Username, r.Sender.ProfilePictureUrl },
                    r.Message,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(requests);
        }

        // PUT /api/friends/request/{id}/accept
        [HttpPut("request/{id}/accept")]
        public async Task<IActionResult> AcceptRequest(Guid id)
        {
            var request = await _db.FriendRequests
                .FirstOrDefaultAsync(r => r.Id == id && r.ReceiverId == CurrentUserId &&
                                          r.Status == FriendRequestStatus.Pending);
            if (request == null) return NotFound();

            request.Status = FriendRequestStatus.Accepted;
            request.RespondedAt = DateTime.UtcNow;

            // Create mutual friendship
            _db.Friendships.Add(new Friendship { User1Id = request.SenderId, User2Id = CurrentUserId });
            await _db.SaveChangesAsync();

            return Ok(new { message = "Đã chấp nhận lời mời kết bạn" });
        }

        // PUT /api/friends/request/{id}/reject
        [HttpPut("request/{id}/reject")]
        public async Task<IActionResult> RejectRequest(Guid id)
        {
            var request = await _db.FriendRequests
                .FirstOrDefaultAsync(r => r.Id == id && r.ReceiverId == CurrentUserId &&
                                          r.Status == FriendRequestStatus.Pending);
            if (request == null) return NotFound();

            request.Status = FriendRequestStatus.Rejected;
            request.RespondedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Đã từ chối lời mời kết bạn" });
        }

        // GET /api/friends
        [HttpGet]
        public async Task<IActionResult> GetFriends()
        {
            var friendships = await _db.Friendships
                .Include(f => f.User1)
                .Include(f => f.User2)
                .Where(f => f.User1Id == CurrentUserId || f.User2Id == CurrentUserId)
                .ToListAsync();

            var friends = friendships.Select(f =>
            {
                var friend = f.User1Id == CurrentUserId ? f.User2 : f.User1;
                return new
                {
                    id = friend.Id,
                    username = friend.Username,
                    phoneNumber = friend.PhoneNumber,
                    profilePictureUrl = friend.ProfilePictureUrl,
                    isOnline = friend.IsOnline,
                    lastSeenAt = friend.LastSeenAt,
                    connectionId = friend.ConnectionId,
                    friendshipCreatedAt = f.CreatedAt
                };
            });

            return Ok(friends);
        }

        // DELETE /api/friends/{userId}
        [HttpDelete("{userId}")]
        public async Task<IActionResult> RemoveFriend(Guid userId)
        {
            var friendship = await _db.Friendships.FirstOrDefaultAsync(f =>
                (f.User1Id == CurrentUserId && f.User2Id == userId) ||
                (f.User1Id == userId && f.User2Id == CurrentUserId));

            if (friendship == null) return NotFound(new { message = "Không tìm thấy quan hệ bạn bè" });

            _db.Friendships.Remove(friendship);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Đã xóa bạn bè" });
        }

        // POST /api/friends/block/{userId}
        [HttpPost("block/{userId}")]
        public async Task<IActionResult> BlockUser(Guid userId)
        {
            var alreadyBlocked = await _db.BlockedUsers.AnyAsync(b =>
                b.BlockerId == CurrentUserId && b.BlockedId == userId);
            if (alreadyBlocked) return Conflict(new { message = "Đã chặn người dùng này" });

            _db.BlockedUsers.Add(new BlockedUser { BlockerId = CurrentUserId, BlockedId = userId });

            // Remove friendship if exists
            var friendship = await _db.Friendships.FirstOrDefaultAsync(f =>
                (f.User1Id == CurrentUserId && f.User2Id == userId) ||
                (f.User1Id == userId && f.User2Id == CurrentUserId));
            if (friendship != null) _db.Friendships.Remove(friendship);

            await _db.SaveChangesAsync();
            return Ok(new { message = "Đã chặn người dùng" });
        }

        // GET /api/friends/blocked - List all blocked users
        [HttpGet("blocked")]
        public async Task<IActionResult> GetBlockedUsers()
        {
            var blockedList = await _db.BlockedUsers
                .Include(b => b.Blocked)
                .Where(b => b.BlockerId == CurrentUserId)
                .Select(b => new
                {
                    id = b.Blocked.Id,
                    username = b.Blocked.Username,
                    profilePictureUrl = b.Blocked.ProfilePictureUrl
                })
                .ToListAsync();

            return Ok(blockedList);
        }

        // POST /api/friends/unblock/{userId} - Unblock a user
        [HttpPost("unblock/{userId}")]
        public async Task<IActionResult> UnblockUser(Guid userId)
        {
            var blockedRecord = await _db.BlockedUsers
                .FirstOrDefaultAsync(b => b.BlockerId == CurrentUserId && b.BlockedId == userId);

            if (blockedRecord == null) return NotFound(new { message = "Không tìm thấy người dùng này trong danh sách chặn" });

            _db.BlockedUsers.Remove(blockedRecord);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Đã bỏ chặn người dùng" });
        }

        public record FriendRequestBody(string PhoneNumber, string? Message);
    }
}
