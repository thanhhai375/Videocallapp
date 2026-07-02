namespace VideoCall.Domain.Entities
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Username { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string PasswordHash { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
        public string? Bio { get; set; }
        public bool IsOnline { get; set; } = false;
        public string? ConnectionId { get; set; }
        public string? Job { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public DateTime? LastSeenAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsEmailVerified { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public string Role { get; set; } = "User"; // User, Admin

        // Navigation
        public ICollection<Message> SentMessages { get; set; } = new List<Message>();
        public ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();
        public ICollection<FriendRequest> SentFriendRequests { get; set; } = new List<FriendRequest>();
        public ICollection<FriendRequest> ReceivedFriendRequests { get; set; } = new List<FriendRequest>();
        public ICollection<Friendship> Friendships1 { get; set; } = new List<Friendship>();
        public ICollection<Friendship> Friendships2 { get; set; } = new List<Friendship>();
        public ICollection<CallLog> InitiatedCalls { get; set; } = new List<CallLog>();
        public ICollection<CallLog> ReceivedCalls { get; set; } = new List<CallLog>();
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();
        public ICollection<BlockedUser> BlockedUsers { get; set; } = new List<BlockedUser>();
        public ICollection<Story> Stories { get; set; } = new List<Story>();

        // Backward compat helpers (used in Hub)
        public string Name => Username;
    }
}
