namespace VideoCall.Domain.Entities
{
    public class ChatGroupMember
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid GroupId { get; set; }
        public Guid UserId { get; set; }
        public string Role { get; set; } = "Member"; // Admin, Member
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        public ChatGroup Group { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
