using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using VideoCall.Domain.Entities;
using VideoCall.Infrastructure.Data;

using System.Collections.Concurrent;

namespace VideoCall.Infrastructure.SignalR
{
    [Authorize]
    public class VideoCallHub : Hub
    {
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, List<(string ConnectionId, string UserId, string Username)>> _activeGroupCalls = new();
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

            // Join all chat groups
            var groupIds = _db.ChatGroupMembers
                .Where(gm => gm.UserId == userId)
                .Select(gm => gm.GroupId)
                .ToList();
            
            foreach (var groupId in groupIds)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, groupId.ToString());
            }

            await Clients.Caller.SendAsync("LoadFriends", friends);
            await Clients.Others.SendAsync("UserStatusChanged", userId.ToString(), true, Context.ConnectionId);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? ex)
        {
            var userId = CurrentUserId;

            // Remove from any active group calls
            foreach (var call in _activeGroupCalls)
            {
                if (call.Value.Any(m => m.ConnectionId == Context.ConnectionId))
                {
                    call.Value.RemoveAll(m => m.ConnectionId == Context.ConnectionId);
                    await Clients.Group(call.Key).SendAsync("UserLeftGroupCall", call.Key, userId.ToString(), Context.ConnectionId);
                    if (call.Value.Count == 0)
                    {
                        _activeGroupCalls.TryRemove(call.Key, out _);
                        await Clients.Group(call.Key).SendAsync("GroupCallEnded", call.Key);
                    }
                }
            }

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
        public async Task SendMessage(string targetId, string content, string messageType = "Text", bool isGroup = false)
        {
            var senderId = CurrentUserId;
            if (!Guid.TryParse(targetId, out var parsedId)) return;

            var msgType = Enum.TryParse<MessageType>(messageType, out var mt) ? mt : MessageType.Text;
            string? mediaUrl = msgType != MessageType.Text ? content : null;

            var message = new Message
            {
                SenderId = senderId,
                Content = msgType == MessageType.Text ? content : string.Empty,
                MessageType = msgType,
                MediaUrl = mediaUrl,
            };

            if (isGroup) {
                message.GroupId = parsedId;
            } else {
                message.ReceiverId = parsedId;
            }

            _db.Messages.Add(message);
            await _db.SaveChangesAsync();

            var payload = new
            {
                id = message.Id,
                senderId = message.SenderId,
                content = message.Content,
                messageType = message.MessageType.ToString(),
                mediaUrl = message.MediaUrl,
                createdAt = message.CreatedAt,
                isGroup = isGroup,
                groupId = isGroup ? parsedId.ToString() : null
            };

            if (isGroup) {
                // Send to the entire group
                await Clients.Group(parsedId.ToString()).SendAsync("ReceiveMessage", senderId.ToString(), content, message.Id.ToString(), true, parsedId.ToString());
            } else {
                await Clients.Caller.SendAsync("ReceiveMessage", senderId.ToString(), content, message.Id.ToString(), false, null);
                var targetUser = await _db.Users.FindAsync(parsedId);
                if (targetUser?.ConnectionId != null)
                {
                    await Clients.Client(targetUser.ConnectionId)
                        .SendAsync("ReceiveMessage", senderId.ToString(), content, message.Id.ToString(), false, null);
                }
            }
        }

        public async Task GetChatHistory(string targetId)
        {
            if (!Guid.TryParse(targetId, out var otherId)) return;
            var myId = CurrentUserId;

            var isGroup = _db.ChatGroups.Any(g => g.Id == otherId);

            List<dynamic> history;
            if (isGroup) {
                history = _db.Messages
                    .Where(m => m.GroupId == otherId)
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => new { m.SenderId, Content = m.IsDeleted ? "Tin nhắn đã bị xóa" : m.Content, m.CreatedAt, m.Id })
                    .ToList<dynamic>();
            } else {
                history = _db.Messages
                    .Where(m =>
                        (m.SenderId == myId && m.ReceiverId == otherId) ||
                        (m.SenderId == otherId && m.ReceiverId == myId))
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => new { m.SenderId, Content = m.IsDeleted ? "Tin nhắn đã bị xóa" : m.Content, m.CreatedAt, m.Id })
                    .ToList<dynamic>();
            }

            var unreadIds = _db.Messages
                .Where(m => !isGroup ? (m.SenderId == otherId && m.ReceiverId == myId) : (m.GroupId == otherId && m.SenderId != myId))
                .Where(m => !m.ReadReceipts.Any(r => r.ReaderId == myId))
                .Select(m => m.Id)
                .ToList();
            
            foreach (var msgId in unreadIds)
            {
                _db.MessageReadReceipts.Add(new MessageReadReceipt { MessageId = msgId, ReaderId = myId });
            }
            if (unreadIds.Any()) await _db.SaveChangesAsync();

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

        public async Task CreateGroup(string name, List<string> memberIds)
        {
            var groupId = Guid.NewGuid();
            var group = new ChatGroup
            {
                Id = groupId,
                Name = name,
                CreatedById = CurrentUserId
            };

            _db.ChatGroups.Add(group);

            // Add Creator
            _db.ChatGroupMembers.Add(new ChatGroupMember { GroupId = groupId, UserId = CurrentUserId, Role = "Admin" });
            await Groups.AddToGroupAsync(Context.ConnectionId, groupId.ToString());

            // Add other members
            foreach (var mId in memberIds)
            {
                if (Guid.TryParse(mId, out var parsedId))
                {
                    _db.ChatGroupMembers.Add(new ChatGroupMember { GroupId = groupId, UserId = parsedId, Role = "Member" });
                    var user = await _db.Users.FindAsync(parsedId);
                    if (user?.ConnectionId != null)
                    {
                        await Groups.AddToGroupAsync(user.ConnectionId, groupId.ToString());
                    }
                }
            }

            await _db.SaveChangesAsync();
            await Clients.Group(groupId.ToString()).SendAsync("GroupCreated", groupId.ToString(), name);
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
        public Task<bool> CheckActiveGroupCall(string groupId)
        {
            return Task.FromResult(_activeGroupCalls.ContainsKey(groupId));
        }

        public async Task StartGroupCall(string groupId)
        {
            var user = await _db.Users.FindAsync(CurrentUserId);
            _activeGroupCalls[groupId] = new List<(string, string, string)> { (Context.ConnectionId, CurrentUserId.ToString(), user?.Username ?? "Unknown") };
            await Groups.AddToGroupAsync(Context.ConnectionId, groupId);
            await Clients.Group(groupId).SendAsync("GroupCallStarted", groupId, CurrentUserId, user?.Username ?? "Unknown");
        }

        public async Task<object> JoinGroupCall(string groupId)
        {
            if (!_activeGroupCalls.ContainsKey(groupId))
            {
                _activeGroupCalls[groupId] = new List<(string, string, string)>();
            }
            var members = _activeGroupCalls[groupId];
            
            var existingMembers = members.Select(m => new { connectionId = m.ConnectionId, userId = m.UserId, name = m.Username }).ToList();
            var user = await _db.Users.FindAsync(CurrentUserId);
            
            if (!members.Any(m => m.ConnectionId == Context.ConnectionId))
            {
                members.Add((Context.ConnectionId, CurrentUserId.ToString(), user?.Username ?? "Unknown"));
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, groupId);
            
            // Notify others
            await Clients.Group(groupId).SendAsync("UserJoinedGroupCall", groupId, CurrentUserId, Context.ConnectionId, user?.Username ?? "Unknown");
            
            return existingMembers;
        }

        public async Task LeaveGroupCall(string groupId)
        {
            if (_activeGroupCalls.TryGetValue(groupId, out var members))
            {
                members.RemoveAll(m => m.ConnectionId == Context.ConnectionId);
                if (members.Count == 0)
                {
                    _activeGroupCalls.TryRemove(groupId, out _);
                    await Clients.Group(groupId).SendAsync("GroupCallEnded", groupId);
                }
            }
            
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId);
            await Clients.Group(groupId).SendAsync("UserLeftGroupCall", groupId, CurrentUserId, Context.ConnectionId);
        }

        public async Task SendGroupOffer(string targetConnectionId, string sdp, string groupId)
        {
            await Clients.Client(targetConnectionId).SendAsync("ReceiveGroupOffer", CurrentUserId.ToString(), Context.ConnectionId, sdp, groupId);
        }

        public async Task SendGroupAnswer(string targetConnectionId, string sdp, string groupId)
        {
            await Clients.Client(targetConnectionId).SendAsync("ReceiveGroupAnswer", CurrentUserId.ToString(), Context.ConnectionId, sdp, groupId);
        }

        public async Task SendGroupIce(string targetConnectionId, object candidate, string groupId)
        {
            await Clients.Client(targetConnectionId).SendAsync("ReceiveGroupIce", CurrentUserId.ToString(), Context.ConnectionId, candidate, groupId);
        }
    }
}
