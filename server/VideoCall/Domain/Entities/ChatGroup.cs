namespace VideoCall.Domain.Entities
{
    public class ChatGroup
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Guid CreatedById { get; set; }
        
        public User CreatedBy { get; set; } = null!;
        public ICollection<ChatGroupMember> Members { get; set; } = new List<ChatGroupMember>();
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}
