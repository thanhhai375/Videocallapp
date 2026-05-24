using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using VideoCall.Domain.Entities;
using VideoCall.Infrastructure.Data;

namespace VideoCall.Infrastructure.SignalR
{
    [Authorize]
    public class VideoCallHub : Hub
    {
        private readonly AppDbContext _db;

        public VideoCallHub(AppDbContext db)
        {
            _db = db;
        }

        private Guid CurrentUserId => Guid.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public override async Task OnConnectedAsync()
        {
            var userId = CurrentUserId;
            var user = await _db.Users.FindAsync(userId);
            if (user == null) { Context.Abort(); return; }

            user.IsOnline = true;
            user.ConnectionId = Context.ConnectionId;
            await _db.SaveChangesAsync();

            // Get all friends with online status
            var friendIds = _db.Friendships
                .Where(f => f.User1Id == userId || f.User2Id == userId)
                .Select(f => f.User1Id == userId ? f.User2Id : f.User1Id)
                .ToList();

            var friends = _db.Users
                .Where(u => friendIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Username, u.IsOnline, u.ConnectionId, u.ProfilePictureUrl, Name = u.Username })
                .ToList();

            await Clients.Caller.SendAsync("LoadFriends", friends);
            await Clients.Others.SendAsync("UserStatusChanged", userId.ToString(), true, Context.ConnectionId);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? ex)
        {
            var userId = CurrentUserId;
            var user = await _db.Users.FindAsync(userId);
            if (user != null)
            {
                user.IsOnline = false;
                user.ConnectionId = null;
                user.LastSeenAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                await Clients.Others.SendAsync("UserStatusChanged", userId.ToString(), false, null);
            }
            await base.OnDisconnectedAsync(ex);
        }

        // ── CHAT ─────────────────────────────────────────────────────
        public async Task SendMessage(string targetId, string content, string messageType = "Text")
        {
            var senderId = CurrentUserId;
            if (!Guid.TryParse(targetId, out var receiverId)) return;

            var msgType = Enum.TryParse<MessageType>(messageType, out var mt) ? mt : MessageType.Text;
            string? mediaUrl = msgType != MessageType.Text ? content : null;

            var message = new Message
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = msgType == MessageType.Text ? content : string.Empty,
                MessageType = msgType,
                MediaUrl = mediaUrl,
            };

            _db.Messages.Add(message);
            await _db.SaveChangesAsync();

            var payload = new
            {
                id = message.Id,
                senderId = message.SenderId,
                content = message.Content,
                messageType = message.MessageType.ToString(),
                mediaUrl = message.MediaUrl,
                createdAt = message.CreatedAt
            };

            await Clients.Caller.SendAsync("ReceiveMessage", senderId.ToString(), content, message.Id.ToString());

            var targetUser = await _db.Users.FindAsync(receiverId);
            if (targetUser?.ConnectionId != null)
            {
                await Clients.Client(targetUser.ConnectionId)
                    .SendAsync("ReceiveMessage", senderId.ToString(), content, message.Id.ToString());
            }
        }

        public async Task GetChatHistory(string targetId)
        {
            if (!Guid.TryParse(targetId, out var otherId)) return;
            var myId = CurrentUserId;

            var history = _db.Messages
                .Where(m =>
                    (m.SenderId == myId && m.ReceiverId == otherId) ||
                    (m.SenderId == otherId && m.ReceiverId == myId))
                .OrderBy(m => m.CreatedAt)
                .Select(m => new { m.SenderId, Content = m.IsDeleted ? "Tin nhắn đã bị xóa" : m.Content, m.CreatedAt, m.Id })
                .ToList();

            await Clients.Caller.SendAsync("LoadChatHistory", history);
        }

        public async Task TypingStarted(string targetId)
        {
            var targetUser = await _db.Users.FindAsync(Guid.Parse(targetId));
            if (targetUser?.ConnectionId != null)
                await Clients.Client(targetUser.ConnectionId).SendAsync("ReceiveTypingStarted", Context.ConnectionId);
        }

        public async Task TypingEnded(string targetId)
        {
            var targetUser = await _db.Users.FindAsync(Guid.Parse(targetId));
            if (targetUser?.ConnectionId != null)
                await Clients.Client(targetUser.ConnectionId).SendAsync("ReceiveTypingEnded", Context.ConnectionId);
        }

        public async Task MarkMessageSeen(string targetId, string messageId)
        {
            try
            {
                if (!Guid.TryParse(messageId, out var msgGuid)) return;
                var readerId = CurrentUserId;

                var alreadyRead = _db.MessageReadReceipts.Any(r => r.MessageId == msgGuid && r.ReaderId == readerId);
                if (!alreadyRead)
                {
                    _db.MessageReadReceipts.Add(new MessageReadReceipt { MessageId = msgGuid, ReaderId = readerId });
                    await _db.SaveChangesAsync();
                }

                var targetUser = await _db.Users.FindAsync(Guid.Parse(targetId));
                if (targetUser?.ConnectionId != null)
                    await Clients.Client(targetUser.ConnectionId).SendAsync("ReceiveMessageSeen", Context.ConnectionId, messageId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in MarkMessageSeen: {ex.Message}");
                // Ignore duplicate key exceptions for read receipts
            }
        }

        // ── CALLS ─────────────────────────────────────────────────────
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (Guid callerId, Guid receiverId, DateTime startedAt)> _activeCalls = new();

        public async Task CallFriend(string targetConnectionId, string callType = "Video")
        {
            try
            {
                var caller = await _db.Users.FindAsync(CurrentUserId);
                _activeCalls[Context.ConnectionId] = (CurrentUserId, Guid.Empty, DateTime.UtcNow);
                await Clients.Client(targetConnectionId).SendAsync("IncomingCall", Context.ConnectionId, caller?.Username, callType);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in CallFriend: {ex.Message}\n{ex.StackTrace}");
                throw;
            }
        }

        public async Task AcceptCall(string callerConnectionId)
        {
            if (_activeCalls.TryGetValue(callerConnectionId, out var info))
            {
                _activeCalls[callerConnectionId] = (info.callerId, CurrentUserId, info.startedAt);
            }
            await Clients.Client(callerConnectionId).SendAsync("CallAccepted", Context.ConnectionId);
        }

        public async Task RejectCall(string callerConnectionId)
        {
            // Log missed call
            if (_activeCalls.TryGetValue(callerConnectionId, out var info) && info.callerId != Guid.Empty)
            {
                _db.CallLogs.Add(new CallLog
                {
                    CallerId = info.callerId,
                    ReceiverId = CurrentUserId,
                    Status = CallStatus.Rejected,
                    StartedAt = info.startedAt,
                    EndedAt = DateTime.UtcNow
                });
                await _db.SaveChangesAsync();
                _activeCalls.TryRemove(callerConnectionId, out _);
            }
            await Clients.Client(callerConnectionId).SendAsync("CallRejected");
        }

        public async Task EndCall(string targetConnectionId)
        {
            // Log completed call
            if (_activeCalls.TryGetValue(Context.ConnectionId, out var info) && info.receiverId != Guid.Empty)
            {
                var ended = DateTime.UtcNow;
                _db.CallLogs.Add(new CallLog
                {
                    CallerId = info.callerId,
                    ReceiverId = info.receiverId,
                    Status = CallStatus.Completed,
                    StartedAt = info.startedAt,
                    EndedAt = ended,
                    DurationSeconds = (int)(ended - info.startedAt).TotalSeconds
                });
                await _db.SaveChangesAsync();
                _activeCalls.TryRemove(Context.ConnectionId, out _);
            }
            await Clients.Client(targetConnectionId).SendAsync("CallEnded");
        }

        public async Task SendOffer(string targetId, string sdp) => await Clients.Client(targetId).SendAsync("ReceiveOffer", Context.ConnectionId, sdp);
        public async Task SendAnswer(string targetId, string sdp) => await Clients.Client(targetId).SendAsync("ReceiveAnswer", sdp);
        public async Task SendIce(string targetId, object candidate) => await Clients.Client(targetId).SendAsync("ReceiveIce", candidate);
    }
}
