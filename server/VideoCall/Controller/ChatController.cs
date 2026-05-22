using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VideoCall.Infrastructure.Data;

namespace VideoCall.Controller
{
    [ApiController]
    [Route("api/chat")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _db;
        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public ChatController(AppDbContext db) { _db = db; }

        // GET /api/chat/history/{userId}?page=1&size=20
        [HttpGet("history/{userId}")]
        public async Task<IActionResult> GetHistory(Guid userId, [FromQuery] int page = 1, [FromQuery] int size = 20)
        {
            if (page < 1) page = 1;
            if (size > 50) size = 50;

            var total = await _db.Messages
                .IgnoreQueryFilters()
                .CountAsync(m =>
                    (m.SenderId == CurrentUserId && m.ReceiverId == userId) ||
                    (m.SenderId == userId && m.ReceiverId == CurrentUserId));

            var messages = await _db.Messages
                .Include(m => m.Sender)
                .Include(m => m.ReadReceipts)
                .Include(m => m.Reactions)
                .Where(m =>
                    (m.SenderId == CurrentUserId && m.ReceiverId == userId) ||
                    (m.SenderId == userId && m.ReceiverId == CurrentUserId))
                .OrderByDescending(m => m.CreatedAt)
                .Skip((page - 1) * size)
                .Take(size)
                .Select(m => new
                {
                    id = m.Id,
                    senderId = m.SenderId,
                    senderName = m.Sender.Username,
                    content = m.IsDeleted ? "Tin nhắn đã bị xóa" : m.Content,
                    messageType = m.MessageType.ToString(),
                    mediaUrl = m.MediaUrl,
                    isDeleted = m.IsDeleted,
                    createdAt = m.CreatedAt,
                    editedAt = m.EditedAt,
                    readBy = m.ReadReceipts.Select(r => r.ReaderId),
                    reactions = m.Reactions.Select(r => new { r.EmojiCode, r.UserId })
                })
                .ToListAsync();

            // Mark messages as read
            var unreadMessageIds = await _db.Messages
                .Where(m => m.SenderId == userId && m.ReceiverId == CurrentUserId)
                .Where(m => !m.ReadReceipts.Any(r => r.ReaderId == CurrentUserId))
                .Select(m => m.Id)
                .ToListAsync();

            foreach (var msgId in unreadMessageIds)
            {
                _db.MessageReadReceipts.Add(new() { MessageId = msgId, ReaderId = CurrentUserId });
            }
            if (unreadMessageIds.Any()) await _db.SaveChangesAsync();

            return Ok(new
            {
                totalCount = total,
                page,
                size,
                totalPages = (int)Math.Ceiling((double)total / size),
                messages = messages.OrderBy(m => m.createdAt) // Return chronological
            });
        }

        // DELETE /api/chat/messages/{messageId}
        [HttpDelete("messages/{messageId}")]
        public async Task<IActionResult> DeleteMessage(Guid messageId)
        {
            var message = await _db.Messages.FindAsync(messageId);
            if (message == null) return NotFound();
            if (message.SenderId != CurrentUserId) return Forbid();

            message.IsDeleted = true;
            message.DeletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Đã xóa tin nhắn" });
        }

        // GET /api/chat/conversations - List all conversations with last message
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var friendIds = await _db.Friendships
                .Where(f => f.User1Id == CurrentUserId || f.User2Id == CurrentUserId)
                .Select(f => f.User1Id == CurrentUserId ? f.User2Id : f.User1Id)
                .ToListAsync();

            var result = new List<object>();
            foreach (var friendId in friendIds)
            {
                var friend = await _db.Users.FindAsync(friendId);
                if (friend == null) continue;

                var lastMessage = await _db.Messages
                    .Where(m =>
                        (m.SenderId == CurrentUserId && m.ReceiverId == friendId) ||
                        (m.SenderId == friendId && m.ReceiverId == CurrentUserId))
                    .OrderByDescending(m => m.CreatedAt)
                    .FirstOrDefaultAsync();

                var unreadCount = await _db.Messages
                    .Where(m => m.SenderId == friendId && m.ReceiverId == CurrentUserId)
                    .Where(m => !m.ReadReceipts.Any(r => r.ReaderId == CurrentUserId))
                    .CountAsync();

                result.Add(new
                {
                    userId = friend.Id,
                    username = friend.Username,
                    profilePictureUrl = friend.ProfilePictureUrl,
                    isOnline = friend.IsOnline,
                    lastSeenAt = friend.LastSeenAt,
                    connectionId = friend.ConnectionId,
                    lastMessage = lastMessage == null ? null : new
                    {
                        content = lastMessage.IsDeleted ? "Tin nhắn đã bị xóa" : lastMessage.Content,
                        messageType = lastMessage.MessageType.ToString(),
                        createdAt = lastMessage.CreatedAt,
                        isMine = lastMessage.SenderId == CurrentUserId
                    },
                    unreadCount
                });
            }

            return Ok(result.OrderByDescending(r => ((dynamic)r).lastMessage?.createdAt));
        }
    }
}
