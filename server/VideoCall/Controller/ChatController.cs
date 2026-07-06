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

            var sentMessageUserIds = await _db.Messages
                .Where(m => m.SenderId == CurrentUserId && m.ReceiverId != null)
                .Select(m => m.ReceiverId!.Value)
                .Distinct()
                .ToListAsync();

            var blockedUserIds = await _db.BlockedUsers
                .Where(bu => bu.BlockerId == CurrentUserId)
                .Select(bu => bu.BlockedId)
                .ToListAsync();

            // Main inbox = Friends OR (Non-friends who we have sent messages to) EXCEPT blocked users
            var mainInboxUserIds = friendIds.Union(sentMessageUserIds)
                .Except(blockedUserIds)
                .Where(id => id != CurrentUserId)
                .Distinct()
                .ToList();

            var result = await BuildConversationList(mainInboxUserIds);
            var groupResult = await BuildGroupConversationList();
            
            var combined = result.Concat(groupResult).OrderByDescending(r => ((dynamic)r).lastMessage?.createdAt).ToList();
            return Ok(combined);
        }

        // GET /api/chat/requests - List all message requests (not friends, no reply, not blocked, not spam)
        [HttpGet("requests")]
        public async Task<IActionResult> GetRequests()
        {
            var friendIds = await _db.Friendships
                .Where(f => f.User1Id == CurrentUserId || f.User2Id == CurrentUserId)
                .Select(f => f.User1Id == CurrentUserId ? f.User2Id : f.User1Id)
                .ToListAsync();

            var sentMessageUserIds = await _db.Messages
                .Where(m => m.SenderId == CurrentUserId && m.ReceiverId != null)
                .Select(m => m.ReceiverId!.Value)
                .Distinct()
                .ToListAsync();

            var blockedUserIds = await _db.BlockedUsers
                .Where(bu => bu.BlockerId == CurrentUserId)
                .Select(bu => bu.BlockedId)
                .ToListAsync();

            var receivedMessageUserIds = await _db.Messages
                .Where(m => m.ReceiverId == CurrentUserId)
                .Select(m => m.SenderId)
                .Distinct()
                .ToListAsync();

            var potentialRequestUserIds = receivedMessageUserIds
                .Except(friendIds)
                .Except(sentMessageUserIds)
                .Except(blockedUserIds)
                .Where(id => id != CurrentUserId)
                .Distinct()
                .ToList();

            var allRequests = await BuildConversationList(potentialRequestUserIds);
            
            // Filter out spam messages
            var result = allRequests.Where(r => 
            {
                var lastMsg = ((dynamic)r).lastMessage;
                return lastMsg == null || !IsSpamMessage(lastMsg.content);
            }).ToList();

            return Ok(result);
        }

        // GET /api/chat/spam - List all spam messages (not friends, no reply, and either blocked or spam content)
        [HttpGet("spam")]
        public async Task<IActionResult> GetSpam()
        {
            var friendIds = await _db.Friendships
                .Where(f => f.User1Id == CurrentUserId || f.User2Id == CurrentUserId)
                .Select(f => f.User1Id == CurrentUserId ? f.User2Id : f.User1Id)
                .ToListAsync();

            var sentMessageUserIds = await _db.Messages
                .Where(m => m.SenderId == CurrentUserId && m.ReceiverId != null)
                .Select(m => m.ReceiverId!.Value)
                .Distinct()
                .ToListAsync();

            var blockedUserIds = await _db.BlockedUsers
                .Where(bu => bu.BlockerId == CurrentUserId)
                .Select(bu => bu.BlockedId)
                .ToListAsync();

            var receivedMessageUserIds = await _db.Messages
                .Where(m => m.ReceiverId == CurrentUserId)
                .Select(m => m.SenderId)
                .Distinct()
                .ToListAsync();

            // Spam includes non-friends we have received messages from, not replied to, and either blocked or spam content
            var potentialSpamUserIds = receivedMessageUserIds
                .Except(friendIds)
                .Except(sentMessageUserIds)
                .Where(id => id != CurrentUserId)
                .Distinct()
                .ToList();

            var allPotentialSpam = await BuildConversationList(potentialSpamUserIds);

            var result = allPotentialSpam.Where(r => 
            {
                var userId = (Guid)((dynamic)r).userId;
                var isBlocked = blockedUserIds.Contains(userId);
                var lastMsg = ((dynamic)r).lastMessage;
                var isSpamContent = lastMsg != null && IsSpamMessage(lastMsg.content);
                return isBlocked || isSpamContent;
            }).ToList();

            return Ok(result);
        }

        private bool IsSpamMessage(string content)
        {
            if (string.IsNullOrEmpty(content)) return false;
            var lowerContent = content.ToLower();
            string[] spamKeywords = { "quảng cáo", "việc nhẹ", "lừa đảo", "trúng thưởng", "http", "https", "link", "vay tiền", "tuyển dụng", "nhận quà", "casino", "đánh bạc", "mua bán", "khuyến mãi" };
            foreach (var keyword in spamKeywords)
            {
                if (lowerContent.Contains(keyword)) return true;
            }
            return false;
        }

        private async Task<List<object>> BuildConversationList(List<Guid> userIds)
        {
            var result = new List<object>();
            foreach (var userId in userIds)
            {
                var user = await _db.Users.FindAsync(userId);
                if (user == null) continue;

                var lastMessage = await _db.Messages
                    .Where(m =>
                        (m.SenderId == CurrentUserId && m.ReceiverId == userId) ||
                        (m.SenderId == userId && m.ReceiverId == CurrentUserId))
                    .OrderByDescending(m => m.CreatedAt)
                    .FirstOrDefaultAsync();

                var unreadCount = await _db.Messages
                    .Where(m => m.SenderId == userId && m.ReceiverId == CurrentUserId)
                    .Where(m => !m.ReadReceipts.Any(r => r.ReaderId == CurrentUserId))
                    .CountAsync();

                result.Add(new
                {
                    userId = user.Id,
                    username = user.Username,
                    profilePictureUrl = user.ProfilePictureUrl,
                    isOnline = user.IsOnline,
                    lastSeenAt = user.LastSeenAt,
                    connectionId = user.ConnectionId,
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
            return result.OrderByDescending(r => ((dynamic)r).lastMessage?.createdAt).ToList();
        }

        [HttpGet("group/{groupId}/members")]
        public async Task<IActionResult> GetGroupMembers(Guid groupId)
        {
            var isMember = await _db.ChatGroupMembers.AnyAsync(gm => gm.GroupId == groupId && gm.UserId == CurrentUserId);
            if (!isMember) return Unauthorized();

            var members = await _db.ChatGroupMembers
                .Include(gm => gm.User)
                .Where(gm => gm.GroupId == groupId)
                .Select(gm => new
                {
                    gm.User.Id,
                    gm.User.Username,
                    gm.User.ProfilePictureUrl,
                    gm.Role,
                    gm.User.IsOnline
                })
                .ToListAsync();

            return Ok(members);
        }

        [HttpDelete("history/{targetId}")]
        public async Task<IActionResult> DeleteHistory(Guid targetId, [FromQuery] bool isGroup = false)
        {
            if (isGroup)
            {
                var messages = await _db.Messages
                    .Where(m => m.GroupId == targetId)
                    .ToListAsync();
                _db.Messages.RemoveRange(messages);
            }
            else
            {
                var messages = await _db.Messages
                    .Where(m =>
                        (m.SenderId == CurrentUserId && m.ReceiverId == targetId) ||
                        (m.SenderId == targetId && m.ReceiverId == CurrentUserId))
                    .ToListAsync();
                _db.Messages.RemoveRange(messages);
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = "Đã xóa cuộc trò chuyện." });
        }

        [HttpDelete("group/{groupId}/leave")]
        public async Task<IActionResult> LeaveGroup(Guid groupId)
        {
            var member = await _db.ChatGroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == CurrentUserId);

            if (member == null) return NotFound("Bạn không ở trong nhóm này.");

            _db.ChatGroupMembers.Remove(member);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Đã rời nhóm." });
        }
        private async Task<List<object>> BuildGroupConversationList()
        {
            var result = new List<object>();
            var groupIds = await _db.ChatGroupMembers
                .Where(gm => gm.UserId == CurrentUserId)
                .Select(gm => gm.GroupId)
                .ToListAsync();

            foreach (var groupId in groupIds)
            {
                var group = await _db.ChatGroups.FindAsync(groupId);
                if (group == null) continue;

                var lastMessage = await _db.Messages
                    .Where(m => m.GroupId == groupId)
                    .OrderByDescending(m => m.CreatedAt)
                    .FirstOrDefaultAsync();

                var unreadCount = 0; // Simplified for now

                result.Add(new
                {
                    userId = group.Id, // Frontend uses userId for routing ID right now
                    username = group.Name,
                    profilePictureUrl = group.AvatarUrl,
                    isOnline = false,
                    lastSeenAt = (DateTime?)null,
                    connectionId = (string?)null,
                    isGroup = true,
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
            return result;
        }
    }
}
